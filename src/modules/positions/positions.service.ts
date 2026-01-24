import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cargo } from './entities/cargo.entity';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { ApiQueryHelper } from '../../common/utils/api-query-helper';

/**
 * PositionsService
 * 
 * Lógica de negocio para gestión de Cargos.
 * Implementa CRUD completo con soft delete (estado = 0).
 */
@Injectable()
export class PositionsService {
    private readonly allowedIncludes = ['usuarios', 'organigrama'];
    private readonly allowedFilters = ['id', 'nombre', 'estado'];

    constructor(
        @InjectRepository(Cargo)
        private readonly positionsRepository: Repository<Cargo>,
    ) { }

    /**
     * Lista cargos con filtros y paginación.
     */
    async list(options?: {
        limit?: number;
        page?: number;
        included?: string;
        filter?: Record<string, any>;
    }): Promise<import('../../common/utils/api-query-helper').PaginatedResult<Cargo>> {
        const qb = this.positionsRepository.createQueryBuilder('cargo');

        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'cargo');
        ApiQueryHelper.applyFilters(qb, options?.filter, this.allowedFilters, 'cargo');

        qb.orderBy('cargo.id', 'ASC');

        return ApiQueryHelper.paginate(qb, { limit: options?.limit, page: options?.page });
    }

    /**
     * Obtiene un cargo por ID.
     */
    async show(id: number, options?: { included?: string }): Promise<Cargo> {
        const qb = this.positionsRepository.createQueryBuilder('cargo');

        qb.where('cargo.id = :id', { id });

        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'cargo');

        const cargo = await qb.getOne();

        if (!cargo) {
            throw new NotFoundException(`Cargo con ID ${id} no encontrado`);
        }

        return cargo;
    }

    /**
     * Crea un nuevo cargo.
     */
    async create(createDto: CreatePositionDto): Promise<Cargo> {
        const exists = await this.positionsRepository.findOne({
            where: { nombre: createDto.nombre }
        });

        if (exists) {
            throw new ConflictException(`El cargo "${createDto.nombre}" ya existe`);
        }

        const cargo = this.positionsRepository.create({
            ...createDto,
            estado: createDto.estado ?? 1
        });

        return this.positionsRepository.save(cargo);
    }

    /**
     * Actualiza un cargo existente.
     */
    async update(id: number, updateDto: UpdatePositionDto): Promise<Cargo> {
        const cargo = await this.show(id);

        this.positionsRepository.merge(cargo, updateDto);

        return this.positionsRepository.save(cargo);
    }

    /**
     * Soft delete (cambia estado a 0).
     */
    async delete(id: number): Promise<{ deleted: boolean; id: number }> {
        await this.show(id);

        await this.positionsRepository.update(id, { estado: 0 });

        return { deleted: true, id };
    }
}
