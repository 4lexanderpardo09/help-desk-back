import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Departamento } from './entities/departamento.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { ApiQueryHelper, PaginatedResult } from 'src/common/utils/api-query-helper';

@Injectable()
export class DepartmentsService {
    constructor(
        @InjectRepository(Departamento)
        private readonly departmentRepo: Repository<Departamento>,
    ) { }

    // Listas permitidas para "Scopes" dinámicos
    private readonly allowedIncludes = ['usuarios', 'categorias', 'tickets'];
    private readonly allowedFilters = ['nombre', 'estado'];

    /**
     * Lista los departamentos aplicando filtros y paginación.
     */
    async list(options?: {
        limit?: number;
        page?: number;
        included?: string;
        filter?: Record<string, any>;
    }):Promise<PaginatedResult<Departamento>> {
        const qb = this.departmentRepo.createQueryBuilder('department');

        // Filtro base: solo activos
        qb.where('department.estado = :estado', { estado: 1 });

        // Scopes dinámicos
        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'department');
        ApiQueryHelper.applyFilters(qb, options?.filter, this.allowedFilters, 'department');

        // Ordenamiento default
        qb.orderBy('department.nombre', 'ASC');

        // Paginación
        return ApiQueryHelper.paginate(qb, { limit: options?.limit, page: options?.page });
    }
    
    /**
     * Busca un departamento por su ID.
     */
    async show(id: number, options?: { included?: string }): Promise<Departamento> {
        const qb = this.departmentRepo.createQueryBuilder('department')
            .where('department.id = :id', { id })
            .andWhere('department.estado = :estado', { estado: 1 });

        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'department');

        const department = await qb.getOne();

        if (!department) {
            throw new NotFoundException(`Departamento con ID ${id} no encontrado`);
        }

        return department;
    }

    /**
     * Crea un nuevo departamento.
     * Valida duplicados por nombre.
     * 
     * Las asociaciones con categorías se manejan desde Category.
     */
    async create(createDto: CreateDepartmentDto): Promise<Departamento> {
        const exists = await this.departmentRepo.findOne({
            where: { nombre: createDto.nombre, estado: 1 }
        });

        if (exists) {
            throw new NotFoundException(`El departamento ${createDto.nombre} ya existe`);
        }

        const department = this.departmentRepo.create({
            ...createDto,
            estado: createDto.estado ?? 1,
            fechaCreacion: new Date(),
        });

        return await this.departmentRepo.save(department);
    }

    /**
     * Actualiza un departamento existente.
     */
    async update(id: number, updateDto: UpdateDepartmentDto): Promise<Departamento> {
        const department = await this.show(id);

        this.departmentRepo.merge(department, {
            ...updateDto,
            fechaModificacion: new Date()
        });

        return await this.departmentRepo.save(department);
    }

    /**
     * Elimina lógicamente un departamento (Soft Delete).
     */
    async delete(id: number): Promise<{ deleted: boolean; id: number }> {
        const department = await this.show(id);

        department.estado = 0;
        department.fechaEliminacion = new Date();

        await this.departmentRepo.save(department);

        return { deleted: true, id };
    }
}
