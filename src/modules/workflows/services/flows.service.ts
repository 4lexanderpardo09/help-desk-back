import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Flujo } from '../entities/flujo.entity';
import { CreateFlujoDto } from '../dto/create-flujo.dto';
import { UpdateFlujoDto } from '../dto/update-flujo.dto';
import { ApiQueryHelper, PaginatedResult } from '../../../common/utils/api-query-helper';

@Injectable()
export class FlowsService {
    constructor(
        @InjectRepository(Flujo)
        private readonly flujoRepo: Repository<Flujo>,
    ) { }

    private readonly allowedIncludes = [
        'subcategoria',
        'subcategoria.categoria',
        'pasos',
        'pasos.transicionesOrigen',
        'rutas',
        'rutas.rutaPasos',
        'rutas.rutaPasos.paso',
        'rutas.rutaPasos.paso.transicionesOrigen',
        'rutas.rutaPasos.paso.transicionesOrigen.pasoDestino', // Optional: simpler explicit target resolution
        'pasos.transicionesOrigen.pasoDestino' // Also useful for main steps
    ];
    private readonly allowedFilters = ['nombre', 'estado', 'subcategoria.id'];

    async list(options?: {
        limit?: number;
        page?: number;
        included?: string;
        filter?: Record<string, any>;
    }): Promise<PaginatedResult<Flujo>> {
        const qb = this.flujoRepo.createQueryBuilder('flujo');

        // Base Filter: Active by default (1)
        qb.where('flujo.estado = :estado', { estado: 1 });

        // Apply Includes
        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'flujo');

        // Apply Filters
        ApiQueryHelper.applyFilters(qb, options?.filter, this.allowedFilters, 'flujo');

        // Sort
        qb.orderBy('flujo.id', 'DESC');

        return ApiQueryHelper.paginate(qb, { limit: options?.limit, page: options?.page });
    }

    async show(id: number, options?: { included?: string }): Promise<Flujo> {
        const qb = this.flujoRepo.createQueryBuilder('flujo')
            .where('flujo.id = :id', { id })
            .andWhere('flujo.estado = :estado', { estado: 1 });

        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'flujo');

        const flujo = await qb.getOne();

        if (!flujo) throw new NotFoundException(`Flujo with ID ${id} not found`);
        return flujo;
    }

    async create(dto: CreateFlujoDto) {
        const flujo = this.flujoRepo.create({ ...dto, estado: 1 });
        return this.flujoRepo.save(flujo);
    }

    async update(id: number, dto: UpdateFlujoDto) {
        await this.flujoRepo.update(id, dto);
        return this.show(id);
    }

    async delete(id: number) {
        const result = await this.flujoRepo.update(id, { estado: 0 });
        if (result.affected === 0) {
            throw new NotFoundException(`Flujo with ID ${id} not found`);
        }
        return { deleted: true, id };
    }
}
