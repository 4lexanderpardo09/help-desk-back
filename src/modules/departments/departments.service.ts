import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Departamento } from './entities/departamento.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { ApiQueryHelper } from 'src/common/utils/api-query-helper';

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
    }) {
        const qb = this.departmentRepo.createQueryBuilder('department');

        // Filtro base: solo activos
        qb.where('department.estado = :estado', { estado: 1 });

        // Scopes dinámicos
        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'department');
        ApiQueryHelper.applyFilters(qb, options?.filter, this.allowedFilters, 'department');

        // Ordenamiento default
        qb.orderBy('department.nombre', 'ASC');

        // Paginación
        ApiQueryHelper.applyPagination(qb, { limit: options?.limit, page: options?.page });

        return qb.getMany();
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
     */
    async create(createDto: CreateDepartmentDto): Promise<Departamento> {
        // Validación básica de duplicados
        const exists = await this.departmentRepo.findOne({
            where: { nombre: createDto.nombre, estado: 1 }
        });

        if (exists) {
            throw new NotFoundException(`El departamento ${createDto.nombre} ya existe`);
        }

        const department = this.departmentRepo.create({
            ...createDto,
            estado: 1, // Default activo
            fechaCreacion: new Date(),
        });

        // Relaciones
        if (createDto.categoriaIds?.length) {
            department.categorias = createDto.categoriaIds.map(id => ({ id } as any));
        }

        return await this.departmentRepo.save(department);
    }

    /**
     * Actualiza un departamento existente.
     */
    async update(id: number, updateDto: UpdateDepartmentDto): Promise<Departamento> {
        const department = await this.show(id);

        // Actualizar manualmente fecha de modificación si existe en la entidad
        const updatedData = {
            ...updateDto,
            fechaModificacion: new Date()
        };

        this.departmentRepo.merge(department, updatedData);

        // Actualizar relaciones
        if (updateDto.categoriaIds) {
            department.categorias = updateDto.categoriaIds.map(id => ({ id } as any));
        }

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
