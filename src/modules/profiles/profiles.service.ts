import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Perfil } from './entities/perfil.entity';
import { UsuarioPerfil } from './entities/usuario-perfil.entity';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ApiQueryHelper } from '../../common/utils/api-query-helper';

/**
 * ProfilesService
 * 
 * Lógica de negocio para gestión de Perfiles.
 * Implementa CRUD completo y sincronización de perfiles por usuario.
 */
@Injectable()
export class ProfilesService {
    private readonly allowedIncludes = ['usuarioPerfiles', 'usuarioPerfiles.usuario'];
    private readonly allowedFilters = ['id', 'nombre', 'estado', 'usuarioId'];

    constructor(
        @InjectRepository(Perfil)
        private readonly profilesRepository: Repository<Perfil>,
        @InjectRepository(UsuarioPerfil)
        private readonly usuarioPerfilRepository: Repository<UsuarioPerfil>,
        private readonly dataSource: DataSource,
    ) { }

    /**
     * Lista perfiles con filtros y paginación.
     * Soporta filtro especial `usuarioId` para listar perfiles de un usuario.
     */
    async list(options?: {
        limit?: number;
        page?: number;
        included?: string;
        filter?: Record<string, any>;
    }): Promise<Perfil[]> {
        const qb = this.profilesRepository.createQueryBuilder('perfil');

        // Filtro especial: usuarioId (JOIN con tabla pivot)
        if (options?.filter?.usuarioId) {
            qb.innerJoin('perfil.usuarioPerfiles', 'up', 'up.usuarioId = :usuarioId AND up.estado = 1', {
                usuarioId: options.filter.usuarioId
            });
            // Remover usuarioId del filter para que no se aplique como filtro normal
            const { usuarioId, ...restFilters } = options.filter;
            options = { ...options, filter: restFilters };
        }

        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'perfil');
        ApiQueryHelper.applyFilters(qb, options?.filter, this.allowedFilters.filter(f => f !== 'usuarioId'), 'perfil');

        qb.orderBy('perfil.id', 'ASC');

        ApiQueryHelper.applyPagination(qb, { limit: options?.limit, page: options?.page });

        return qb.getMany();
    }

    /**
     * Obtiene un perfil por ID.
     */
    async show(id: number, options?: { included?: string }): Promise<Perfil> {
        const qb = this.profilesRepository.createQueryBuilder('perfil');

        qb.where('perfil.id = :id', { id });

        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'perfil');

        const perfil = await qb.getOne();

        if (!perfil) {
            throw new NotFoundException(`Perfil con ID ${id} no encontrado`);
        }

        return perfil;
    }

    /**
     * Crea un nuevo perfil.
     */
    async create(createDto: CreateProfileDto): Promise<Perfil> {
        const exists = await this.profilesRepository.findOne({
            where: { nombre: createDto.nombre }
        });

        if (exists) {
            throw new ConflictException(`El perfil "${createDto.nombre}" ya existe`);
        }

        const perfil = this.profilesRepository.create({
            ...createDto,
            estado: createDto.estado ?? 1,
            fechaCreacion: new Date()
        });

        return this.profilesRepository.save(perfil);
    }

    /**
     * Actualiza un perfil existente.
     */
    async update(id: number, updateDto: UpdateProfileDto): Promise<Perfil> {
        const perfil = await this.show(id);

        this.profilesRepository.merge(perfil, {
            ...updateDto,
            fechaModificacion: new Date()
        });

        return this.profilesRepository.save(perfil);
    }

    /**
     * Soft delete (cambia estado a 0).
     */
    async delete(id: number): Promise<{ deleted: boolean; id: number }> {
        await this.show(id);

        await this.profilesRepository.update(id, {
            estado: 0,
            fechaEliminacion: new Date()
        });

        return { deleted: true, id };
    }

    // ========================================
    // SINCRONIZACIÓN USUARIO-PERFIL
    // ========================================

    /**
     * Sincroniza (reemplaza) los perfiles de un usuario.
     * Operación transaccional: elimina existentes e inserta nuevos.
     * 
     * @param userId ID del usuario
     * @param perfilIds IDs de perfiles a asignar
     */
    async syncUserProfiles(userId: number, perfilIds: number[]): Promise<{ synced: boolean; userId: number; perfilCount: number }> {
        await this.dataSource.transaction(async (manager) => {
            // 1. Eliminar perfiles existentes
            await manager.delete(UsuarioPerfil, { usuarioId: userId });

            // 2. Insertar nuevos perfiles
            if (perfilIds && perfilIds.length > 0) {
                const nuevosPerfiles = perfilIds
                    .filter(pid => pid)
                    .map(perfilId => {
                        return manager.create(UsuarioPerfil, {
                            usuarioId: userId,
                            perfilId: perfilId,
                            estado: 1,
                            fechaCreacion: new Date()
                        });
                    });

                if (nuevosPerfiles.length > 0) {
                    await manager.save(UsuarioPerfil, nuevosPerfiles);
                }
            }
        });

        return { synced: true, userId, perfilCount: perfilIds?.length || 0 };
    }
}
