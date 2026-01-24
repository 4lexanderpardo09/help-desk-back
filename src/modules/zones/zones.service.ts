import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Zona } from './entities/zona.entity';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { ApiQueryHelper } from '../../common/utils/api-query-helper';

@Injectable()
export class ZonesService {
    // Listas blancas para ApiQueryHelper
    private readonly allowedIncludes = ['regionales'];
    private readonly allowedFilters = ['nombre', 'zona_nom'];

    constructor(
        @InjectRepository(Zona)
        private readonly zonaRepository: Repository<Zona>,
    ) { }

    /**
     * Listar zonas con filtros y paginación
     */
    async list(options?: {
        limit?: number;
        page?: number;
        included?: string;
        filter?: Record<string, unknown>;
    }): Promise<import('../../common/utils/api-query-helper').PaginatedResult<Zona>> {
        const qb = this.zonaRepository.createQueryBuilder('zona');

        // Estado por defecto: activos (si no se especifica filtro de estado)
        if (!options?.filter?.est && !options?.filter?.estado) {
            qb.andWhere('zona.est = :est', { est: 1 });
        }

        // Filtros dinámicos
        ApiQueryHelper.applyFilters(qb, options?.filter, this.allowedFilters, 'zona');

        // Relaciones (Includes)
        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'zona');

        // Ordenamiento default
        qb.orderBy('zona.nombre', 'ASC');

        return ApiQueryHelper.paginate(qb, { limit: options?.limit, page: options?.page });
    }

    /**
     * Mostrar una zona por ID
     */
    async show(id: number, options?: { included?: string }): Promise<Zona | null> {
        const qb = this.zonaRepository.createQueryBuilder('zona');
        qb.where('zona.id = :id', { id });

        // Relaciones
        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'zona');

        return qb.getOne();
    }

    /**
     * Crear una nueva zona
     */
    async create(createZoneDto: CreateZoneDto): Promise<Zona> {
        const zona = this.zonaRepository.create({
            ...createZoneDto,
            estado: 1, // Default activo
        });
        return this.zonaRepository.save(zona);
    }

    /**
     * Actualizar una zona
     */
    async update(id: number, updateZoneDto: UpdateZoneDto): Promise<Zona> {
        const zona = await this.zonaRepository.preload({
            id,
            ...updateZoneDto,
        });

        if (!zona) {
            throw new NotFoundException(`Zona con ID ${id} no encontrada`);
        }

        return this.zonaRepository.save(zona);
    }

    /**
     * Eliminar zona (Soft Delete)
     */
    async delete(id: number): Promise<{ deleted: boolean; id: number }> {
        const zona = await this.show(id);
        if (!zona) {
            throw new NotFoundException(`Zona con ID ${id} no encontrada`);
        }

        // Soft delete: cambiar estado a 0
        await this.zonaRepository.update(id, { estado: 0 });
        return { deleted: true, id };
    }
}
