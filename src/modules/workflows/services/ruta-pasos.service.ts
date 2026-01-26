import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RutaPaso } from '../entities/ruta-paso.entity';
import { CreateRutaPasoDto } from '../dto/create-ruta-paso.dto';
import { UpdateRutaPasoDto } from '../dto/update-ruta-paso.dto';
import { ApiQueryHelper, PaginatedResult } from '../../../common/utils/api-query-helper';

@Injectable()
export class RutaPasosService {
    constructor(
        @InjectRepository(RutaPaso)
        private readonly rutaPasoRepo: Repository<RutaPaso>,
    ) { }

    private readonly allowedIncludes = ['ruta', 'paso', 'paso.cargoAsignado'];
    private readonly allowedFilters = ['estado', 'ruta.id', 'paso.id', 'orden'];

    async list(options?: {
        limit?: number;
        page?: number;
        included?: string;
        filter?: Record<string, any>;
        sort?: string;
    }): Promise<PaginatedResult<RutaPaso>> {
        const qb = this.rutaPasoRepo.createQueryBuilder('rutaPaso');

        // Base Filter: Active by default (1)
        qb.where('rutaPaso.estado = :estado', { estado: 1 });

        // Apply Includes
        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'rutaPaso');

        // Apply Filters
        ApiQueryHelper.applyFilters(qb, options?.filter, this.allowedFilters, 'rutaPaso');

        // Sort (Default to orden ASC)
        if (options?.sort) {
            ApiQueryHelper.applySort(qb, options.sort, 'rutaPaso');
        } else {
            qb.orderBy('rutaPaso.orden', 'ASC');
        }

        return ApiQueryHelper.paginate(qb, { limit: options?.limit, page: options?.page });
    }

    async show(id: number, options?: { included?: string }): Promise<RutaPaso> {
        const qb = this.rutaPasoRepo.createQueryBuilder('rutaPaso')
            .where('rutaPaso.id = :id', { id })
            .andWhere('rutaPaso.estado = :estado', { estado: 1 });

        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'rutaPaso');

        const rutaPaso = await qb.getOne();

        if (!rutaPaso) throw new NotFoundException(`RutaPaso with ID ${id} not found`);
        return rutaPaso;
    }

    async create(dto: CreateRutaPasoDto) {
        const rutaPaso = this.rutaPasoRepo.create({ ...dto, estado: 1 });
        return this.rutaPasoRepo.save(rutaPaso);
    }

    async update(id: number, dto: UpdateRutaPasoDto) {
        await this.rutaPasoRepo.update(id, dto);
        return this.show(id);
    }

    async delete(id: number) {
        const result = await this.rutaPasoRepo.update(id, { estado: 0 });
        if (result.affected === 0) {
            throw new NotFoundException(`RutaPaso with ID ${id} not found`);
        }
        return { deleted: true, id };
    }
}
