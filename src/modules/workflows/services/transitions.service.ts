import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FlujoTransicion } from '../entities/flujo-transicion.entity';
import { CreateTransitionDto } from '../dto/create-transition.dto';
import { UpdateTransitionDto } from '../dto/update-transition.dto';
import { ApiQueryHelper, PaginatedResult } from '../../../common/utils/api-query-helper';

@Injectable()
export class TransitionsService {
    constructor(
        @InjectRepository(FlujoTransicion)
        private readonly transicionRepo: Repository<FlujoTransicion>,
    ) { }

    private readonly allowedIncludes = ['pasoOrigen', 'pasoDestino', 'pasoOrigen.flujo'];
    private readonly allowedFilters = [
        'condicionNombre',
        'estado',
        'pasoOrigen.id',
        'pasoDestino.id',
        'pasoOrigen.flujo.id' // Important to list transitions of a whole flow
    ];

    /**
     * Lists transitions with filtration and pagination.
     */
    async list(options?: {
        limit?: number;
        page?: number;
        included?: string;
        filter?: Record<string, any>;
    }): Promise<PaginatedResult<FlujoTransicion>> {
        const qb = this.transicionRepo.createQueryBuilder('transicion');

        // Base Filter: Active by default (1)
        qb.where('transicion.estado = :estado', { estado: 1 });

        // Apply Includes
        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'transicion');

        // Apply Filters
        ApiQueryHelper.applyFilters(qb, options?.filter, this.allowedFilters, 'transicion');

        // Sort by ID
        qb.orderBy('transicion.id', 'ASC');

        return ApiQueryHelper.paginate(qb, { limit: options?.limit, page: options?.page });
    }

    /**
     * Finds a single Transition by ID.
     */
    async show(id: number, options?: { included?: string }): Promise<FlujoTransicion> {
        const qb = this.transicionRepo.createQueryBuilder('transicion')
            .where('transicion.id = :id', { id })
            .andWhere('transicion.estado = :estado', { estado: 1 });

        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'transicion');

        const transition = await qb.getOne();

        if (!transition) throw new NotFoundException(`Transition with ID ${id} not found`);
        return transition;
    }

    async create(dto: CreateTransitionDto) {
        const transition = this.transicionRepo.create({ ...dto, estado: 1 });
        return this.transicionRepo.save(transition);
    }

    async update(id: number, dto: UpdateTransitionDto) {
        await this.transicionRepo.update(id, dto);
        return this.show(id);
    }

    async delete(id: number) {
        const result = await this.transicionRepo.update(id, { estado: 0 });
        if (result.affected === 0) {
            throw new NotFoundException(`Transition with ID ${id} not found`);
        }
        return { deleted: true, id };
    }
}
