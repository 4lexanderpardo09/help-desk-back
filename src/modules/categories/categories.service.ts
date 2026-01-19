import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categoria } from './entities/categoria.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ApiQueryDto } from 'src/common/dto/api-query.dto';
import { ApiQueryHelper } from 'src/common/utils/api-query-helper';

@Injectable()
export class CategoriesService {
    constructor(
        @InjectRepository(Categoria)
        private readonly categoryRepo: Repository<Categoria>,
    ) { }

    // Listas permitidas para "Scopes" dinámicos
    private readonly allowedIncludes = ['subcategorias', 'departamentos', 'empresas'];
    private readonly allowedFilters = ['nombre', 'estado'];

    /**
     * Lista las categorías aplicando filtros y paginación.
     */
    async list(options?: {
        limit?: number;
        page?: number;
        included?: string;
        filter?: Record<string, any>;
    }) {
        const qb = this.categoryRepo.createQueryBuilder('category');

        // Filtro base: solo activos
        qb.where('category.estado = :estado', { estado: 1 });

        // Scopes dinámicos
        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'category');
        ApiQueryHelper.applyFilters(qb, options?.filter, this.allowedFilters, 'category');

        // Ordenamiento default
        qb.orderBy('category.nombre', 'ASC');

        // Paginación
        ApiQueryHelper.applyPagination(qb, { limit: options?.limit, page: options?.page });

        return qb.getMany();
    }

    /**
     * Busca una categoría por su ID.
     */
    async show(id: number, options?: { included?: string }): Promise<Categoria> {
        const qb = this.categoryRepo.createQueryBuilder('category')
            .where('category.id = :id', { id })
            .andWhere('category.estado = :estado', { estado: 1 });

        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'category');

        const category = await qb.getOne();

        if (!category) {
            throw new NotFoundException(`Categoria con ID ${id} no encontrada`);
        }

        return category;
    }

    /**
     * Crea una nueva categoría.
     */
    async create(createDto: CreateCategoryDto): Promise<Categoria> {
        const exists = await this.categoryRepo.findOne({ where: { nombre: createDto.nombre } });
        if (exists) {
            throw new ConflictException(`La categoría ${createDto.nombre} ya existe`);
        }

        const category = this.categoryRepo.create(createDto);

        // Relaciones
        if (createDto.departamentoIds?.length) {
            category.departamentos = createDto.departamentoIds.map(id => ({ id } as any));
        }

        if (createDto.empresaIds?.length) {
            category.empresas = createDto.empresaIds.map(id => ({ id } as any));
        }

        return await this.categoryRepo.save(category);
    }

    /**
     * Actualiza una categoría existente.
     */
    async update(id: number, updateDto: UpdateCategoryDto): Promise<Categoria> {
        const category = await this.show(id);

        this.categoryRepo.merge(category, updateDto);

        // Actualizar relaciones si existen en el DTO
        if (updateDto.departamentoIds) {
            category.departamentos = updateDto.departamentoIds.map(id => ({ id } as any));
        }

        if (updateDto.empresaIds) {
            category.empresas = updateDto.empresaIds.map(id => ({ id } as any));
        }

        return await this.categoryRepo.save(category);
    }

    /**
     * Elimina (soft delete) una categoría.
     */
    async delete(id: number): Promise<{ deleted: boolean; id: number }> {
        const category = await this.show(id);
        category.estado = 0;
        await this.categoryRepo.save(category);
        return { deleted: true, id };
    }
}
