import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Regional } from './entities/regional.entity';
import { CreateRegionalDto } from './dto/create-regional.dto';
import { UpdateRegionalDto } from './dto/update-regional.dto';
import { ApiQueryHelper } from '../../common/utils/api-query-helper';

/**
 * RegionsService
 * 
 * Lógica de negocio para gestión de Regionales.
 * Implementa CRUD completo con filtros dinámicos.
 */
@Injectable()
export class RegionsService {
    private readonly allowedIncludes = ['zona', 'usuarios'];
    private readonly allowedFilters = ['id', 'nombre', 'estado', 'zonaId'];

    constructor(
        @InjectRepository(Regional)
        private readonly regionalRepository: Repository<Regional>,
    ) { }

    /**
     * Lista regionales con filtros y paginación.
     */
    async list(options?: {
        limit?: number;
        page?: number;
        included?: string;
        filter?: Record<string, any>;
    }): Promise<Regional[]> {
        const qb = this.regionalRepository.createQueryBuilder('regional');

        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'regional');
        ApiQueryHelper.applyFilters(qb, options?.filter, this.allowedFilters, 'regional');

        qb.orderBy('regional.id', 'ASC');

        ApiQueryHelper.applyPagination(qb, { limit: options?.limit, page: options?.page });

        return qb.getMany();
    }

    /**
     * Obtiene una regional por ID.
     */
    async show(id: number, options?: { included?: string }): Promise<Regional> {
        const qb = this.regionalRepository.createQueryBuilder('regional');

        qb.where('regional.id = :id', { id });

        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'regional');

        const regional = await qb.getOne();

        if (!regional) {
            throw new NotFoundException(`Regional con ID ${id} no encontrada`);
        }

        return regional;
    }

    /**
     * Crea una nueva regional.
     */
    async create(createDto: CreateRegionalDto): Promise<Regional> {
        const exists = await this.regionalRepository.findOne({
            where: { nombre: createDto.nombre, estado: 1 }
        });

        if (exists) {
            throw new ConflictException(`La regional "${createDto.nombre}" ya existe`);
        }

        const regional = this.regionalRepository.create({
            ...createDto,
            estado: createDto.estado ?? 1
        });

        return this.regionalRepository.save(regional);
    }

    /**
     * Actualiza una regional existente.
     */
    async update(id: number, updateDto: UpdateRegionalDto): Promise<Regional> {
        const regional = await this.show(id);

        this.regionalRepository.merge(regional, updateDto);

        return this.regionalRepository.save(regional);
    }

    /**
     * Soft delete (cambia estado a 0).
     */
    async delete(id: number): Promise<{ deleted: boolean; id: number }> {
        await this.show(id);

        await this.regionalRepository.update(id, { estado: 0 });

        return { deleted: true, id };
    }
}
