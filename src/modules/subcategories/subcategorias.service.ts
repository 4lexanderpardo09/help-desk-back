import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subcategoria } from './entities/subcategoria.entity';
import { CreateSubcategoriaDto } from './dto/create-subcategoria.dto';
import { UpdateSubcategoriaDto } from './dto/update-subcategoria.dto';
import { ApiQueryHelper, PaginatedResult } from '../../common/utils/api-query-helper';

@Injectable()
export class SubcategoriasService {
    constructor(
        @InjectRepository(Subcategoria)
        private readonly subcategoriaRepository: Repository<Subcategoria>,
    ) { }

    // Listas permitidas para "Scopes" dinámicos (estilo Laravel)
    private readonly allowedIncludes = ['categoria', 'prioridad'];
    private readonly allowedFilters = ['id', 'nombre', 'categoriaId', 'prioridadId', 'estado'];

    /**
     * Busca una subcategoría por ID
     * Permite incluir relaciones dinámicamente.
     */
    async show(id: number, options?: {
        included?: string;
    }): Promise<Subcategoria> {
        const qb = this.subcategoriaRepository.createQueryBuilder('subcategoria');

        qb.where('subcategoria.id = :id', { id });
        qb.andWhere('subcategoria.estado = :estado', { estado: 1 });

        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'subcategoria');

        const subcategoria = await qb.getOne();

        if (!subcategoria) {
            throw new NotFoundException(`Subcategoría con ID ${id} no encontrada`);
        }
        return subcategoria;
    }

    /**
     * **Búsqueda Maestra Unificada**
     * 
     * Método único para listar subcategorías.
     * Soporta filtros y paginación.
     */
    async list(options?: {
        limit?: number;
        included?: string;
        filter?: Record<string, any>;
        page?: number;
    }): Promise<PaginatedResult<Subcategoria>> {
        const qb = this.subcategoriaRepository.createQueryBuilder('subcategoria');

        qb.where('subcategoria.estado = :estado', { estado: 1 });

        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'subcategoria');
        ApiQueryHelper.applyFilters(qb, options?.filter, this.allowedFilters, 'subcategoria');

        // Ordenamiento por defecto
        qb.orderBy('subcategoria.nombre', 'ASC');

        return ApiQueryHelper.paginate(qb, { limit: options?.limit, page: options?.page });
    }

    /**
     * Crea una nueva subcategoría
     */
    async create(createDto: CreateSubcategoriaDto): Promise<Subcategoria> {
        const existing = await this.subcategoriaRepository.exists({
            where: { nombre: createDto.nombre, categoriaId: createDto.categoriaId, estado: 1 }
        });

        if (existing) {
            throw new ConflictException(`La subcategoría ${createDto.nombre} ya existe en esta categoría`);
        }

        const subcategoria = this.subcategoriaRepository.create({
            ...createDto,
            estado: createDto.estado ?? 1,
        });

        return await this.subcategoriaRepository.save(subcategoria);
    }

    /**
     * Actualiza una subcategoría existente
     */
    async update(id: number, updateDto: UpdateSubcategoriaDto): Promise<Subcategoria> {
        const subcategoria = await this.show(id);

        this.subcategoriaRepository.merge(subcategoria, updateDto);

        return await this.subcategoriaRepository.save(subcategoria);
    }

    /**
     * Elimina una subcategoría (soft delete)
     */
    async delete(id: number): Promise<{ deleted: boolean; id: number }> {
        const subcategoria = await this.show(id);

        // Soft delete manual ya que no usamos @DeleteDateColumn
        await this.subcategoriaRepository.update(id, { estado: 0 });

        return { deleted: true, id };
    }
}
