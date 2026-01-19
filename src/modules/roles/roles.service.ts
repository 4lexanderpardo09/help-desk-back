import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ApiQueryHelper } from '../../common/utils/api-query-helper';

@Injectable()
export class RolesService {
    constructor(
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
    ) { }

    // Listas permitidas para "Scopes" dinámicos (estilo Laravel)
    private readonly allowedIncludes = ['usuarios'];
    private readonly allowedFilters = ['id', 'nombre', 'estado'];

    /**
     * Busca un rol por ID
     * Permite incluir relaciones dinámicamente.
     */
    async show(id: number, options?: {
        included?: string;
    }): Promise<Role> {
        const qb = this.roleRepository.createQueryBuilder('rol');

        qb.where('rol.id = :id', { id });
        qb.andWhere('rol.estado = :estado', { estado: 1 });

        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'rol');

        const role = await qb.getOne();

        if (!role) {
            throw new NotFoundException(`Rol con ID ${id} no encontrado`);
        }
        return role;
    }

    /**
     * **Búsqueda Maestra Unificada**
     * 
     * Método único para listar roles.
     * Soporta filtros y paginación.
     */
    async list(options?: {
        limit?: number;
        included?: string;
        filter?: Record<string, any>;
        page?: number;
    }): Promise<Role[]> {
        const qb = this.roleRepository.createQueryBuilder('rol');

        qb.where('rol.estado = :estado', { estado: 1 });

        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'rol');
        ApiQueryHelper.applyFilters(qb, options?.filter, this.allowedFilters, 'rol');
        ApiQueryHelper.applyPagination(qb, { limit: options?.limit, page: options?.page });

        // Ordenamiento por defecto
        qb.orderBy('rol.nombre', 'ASC');

        return qb.getMany();
    }

    /**
     * Crea un nuevo rol
     */
    async create(createRoleDto: CreateRoleDto): Promise<Role> {
        const existing = await this.roleRepository.exists({
            where: { nombre: createRoleDto.nombre, estado: 1 }
        });

        if (existing) {
            throw new ConflictException(`El rol ${createRoleDto.nombre} ya existe`);
        }

        const role = this.roleRepository.create({
            ...createRoleDto,
            estado: createRoleDto.estado ?? 1,
        });

        return await this.roleRepository.save(role);
    }

    /**
     * Actualiza un rol existente
     */
    async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
        const role = await this.show(id);

        this.roleRepository.merge(role, updateRoleDto);

        return await this.roleRepository.save(role);
    }

    /**
     * Elimina un rol (soft delete)
     */
    async delete(id: number): Promise<{ deleted: boolean; id: number }> {
        const role = await this.show(id);

        // Soft delete manual ya que no usamos @DeleteDateColumn
        await this.roleRepository.update(id, { estado: 0 });

        return { deleted: true, id };
    }
}
