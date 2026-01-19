import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ApiQueryHelper } from '../../common/utils/api-query-helper';
import { ApiQueryDto } from '../../common/dto/api-query.dto';

@Injectable()
export class RolesService {
    constructor(
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
    ) { }

    private readonly allowedIncludes = ['usuarios'];
    private readonly allowedFilters = ['id', 'nombre', 'estado'];

    async list(query?: ApiQueryDto): Promise<Role[]> {
        const qb = this.roleRepository.createQueryBuilder('rol');

        qb.where('rol.estado = :estado', { estado: 1 });

        if (query) {
            ApiQueryHelper.applyIncludes(qb, query.included, this.allowedIncludes, 'rol');
            ApiQueryHelper.applyFilters(qb, query.filter, this.allowedFilters, 'rol');
            ApiQueryHelper.applyPagination(qb, { limit: query.limit, page: query.page });
        }

        if (query?.sort) {
            const [sortField, sortOrder] = query.sort.startsWith('-')
                ? [query.sort.substring(1), 'DESC']
                : [query.sort, 'ASC'];
            qb.orderBy(`rol.${sortField}`, sortOrder as 'ASC' | 'DESC');
        }

        return qb.getMany();
    }

    async show(id: number): Promise<Role> {
        const role = await this.roleRepository.findOne({ where: { id } });
        if (!role) {
            throw new NotFoundException(`Rol con ID ${id} no encontrado`);
        }
        return role;
    }

    async create(createRoleDto: CreateRoleDto): Promise<Role> {
        const existing = await this.roleRepository.findOne({
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

    async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
        const role = await this.show(id);

        this.roleRepository.merge(role, updateRoleDto);

        return await this.roleRepository.save(role);
    }

    async delete(id: number): Promise<{ deleted: boolean; id: number }> {
        const role = await this.show(id);

        // Soft delete manual ya que no usamos @DeleteDateColumn
        await this.roleRepository.update(id, { estado: 0 });

        return { deleted: true, id };
    }
}
