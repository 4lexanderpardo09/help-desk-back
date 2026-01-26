import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasoFlujo } from '../entities/paso-flujo.entity';
import { CreatePasoFlujoDto } from '../dto/create-paso-flujo.dto';
import { UpdatePasoFlujoDto } from '../dto/update-paso-flujo.dto';
import { ApiQueryHelper, PaginatedResult } from '../../../common/utils/api-query-helper';

@Injectable()
export class StepsService {
    constructor(
        @InjectRepository(PasoFlujo)
        private readonly pasoRepo: Repository<PasoFlujo>,
    ) { }

    private readonly allowedIncludes = ['flujo', 'cargoAsignado'];
    private readonly allowedFilters = ['nombre', 'estado', 'flujo.id', 'esAprobacion', 'esTareaNacional'];

    /**
     * Lists steps with filtration and pagination.
     * Supports filtering by `filter[flujo.id]` to list steps of a specific flow.
     */
    async list(options?: {
        limit?: number;
        page?: number;
        included?: string;
        filter?: Record<string, any>;
    }): Promise<PaginatedResult<PasoFlujo>> {
        const qb = this.pasoRepo.createQueryBuilder('paso');

        // Base Filter: Active by default (1)
        qb.where('paso.estado = :estado', { estado: 1 });

        // Apply Includes and Filters
        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'paso');
        ApiQueryHelper.applyFilters(qb, options?.filter, this.allowedFilters, 'paso');

        // Sort by Order by default
        qb.orderBy('paso.orden', 'ASC');

        return ApiQueryHelper.paginate(qb, { limit: options?.limit, page: options?.page });
    }

    /**
     * Finds a single Step by ID.
     */
    async show(id: number, options?: { included?: string }): Promise<PasoFlujo> {
        const qb = this.pasoRepo.createQueryBuilder('paso')
            .where('paso.id = :id', { id })
            .andWhere('paso.estado = :estado', { estado: 1 });

        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'paso');

        const step = await qb.getOne();

        if (!step) throw new NotFoundException(`Step with ID ${id} not found`);
        return step;
    }

    async create(dto: CreatePasoFlujoDto) {
        const step = this.pasoRepo.create({ ...dto, estado: 1 });
        return this.pasoRepo.save(step);
    }

    async update(id: number, dto: UpdatePasoFlujoDto) {
        await this.pasoRepo.update(id, dto);
        return this.show(id);
    }

    async delete(id: number) {
        const result = await this.pasoRepo.update(id, { estado: 0 });
        if (result.affected === 0) {
            throw new NotFoundException(`Step with ID ${id} not found`);
        }
        return { deleted: true, id };
    }

    /**
     * Legacy support wrapper (optional, or we remove it if Controller is updated)
     * The controller asks for `findStepsByFlujo`. I will update controller to use `list` with filter,
     * but if other modules use this service, they might need it.
     * I'll leave it or replace implementation.
     */
    async findStepsByFlujo(flujoId: number) {
        return this.list({
            limit: 100, // No limit usually? Or high limit
            filter: { 'flujo.id': flujoId }
        }).then(res => res.data);
    }
}
