import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ruta } from '../entities/ruta.entity';
import { CreateRutaDto } from '../dto/create-ruta.dto';
import { UpdateRutaDto } from '../dto/update-ruta.dto';
import { ApiQueryHelper, PaginatedResult } from '../../../common/utils/api-query-helper';

@Injectable()
export class RutasService {
    constructor(
        @InjectRepository(Ruta)
        private readonly rutaRepo: Repository<Ruta>,
    ) { }

    private readonly allowedIncludes = ['flujo', 'transiciones', 'rutaPasos', 'rutaPasos.paso'];
    private readonly allowedFilters = ['nombre', 'estado', 'flujo.id'];

    async list(options?: {
        limit?: number;
        page?: number;
        included?: string;
        filter?: Record<string, any>;
    }): Promise<PaginatedResult<Ruta>> {
        const qb = this.rutaRepo.createQueryBuilder('ruta');

        // Base Filter: Active by default (1)
        qb.where('ruta.estado = :estado', { estado: 1 });

        // Apply Includes
        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'ruta');

        // Apply Filters
        ApiQueryHelper.applyFilters(qb, options?.filter, this.allowedFilters, 'ruta');

        // Sort
        qb.orderBy('ruta.id', 'ASC');

        return ApiQueryHelper.paginate(qb, { limit: options?.limit, page: options?.page });
    }

    async show(id: number, options?: { included?: string }): Promise<Ruta> {
        const qb = this.rutaRepo.createQueryBuilder('ruta')
            .where('ruta.id = :id', { id })
            .andWhere('ruta.estado = :estado', { estado: 1 });

        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'ruta');

        const ruta = await qb.getOne();

        if (!ruta) throw new NotFoundException(`Ruta with ID ${id} not found`);
        return ruta;
    }

    async create(dto: CreateRutaDto) {
        const ruta = this.rutaRepo.create({ ...dto, estado: 1 });
        return this.rutaRepo.save(ruta);
    }

    async update(id: number, dto: UpdateRutaDto) {
        await this.rutaRepo.update(id, dto);
        return this.show(id);
    }

    async delete(id: number) {
        const result = await this.rutaRepo.update(id, { estado: 0 });
        if (result.affected === 0) {
            throw new NotFoundException(`Ruta with ID ${id} not found`);
        }
        return { deleted: true, id };
    }
}
