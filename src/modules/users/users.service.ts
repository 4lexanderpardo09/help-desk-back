import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DataSource } from 'typeorm';
import { UsuarioPerfil } from '../profiles/entities/usuario-perfil.entity';
import { ApiQueryHelper } from 'src/common/utils/api-query-helper';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly dataSource: DataSource,
    ) { }

    /**
     * Busca un usuario por email incluyendo el password (para auth)
     */
    async findByEmailWithPassword(email: string): Promise<User | null> {
        return this.userRepository
            .createQueryBuilder('user')
            .addSelect('user.password')
            .where('user.email = :email', { email })
            .andWhere('user.estado = :estado', { estado: 1 })
            .getOne();
    }

    /**
     * Crea un nuevo usuario
     */
    async create(createUserDto: CreateUserDto): Promise<User> {
        // Verificar si el email ya existe (Optimizado: usar count/findOne en lugar de findAllUnified)
        const emailExists = await this.userRepository.exists({ where: { email: createUserDto.email, estado: 1 } });
        if (emailExists) {
            throw new ConflictException('El correo electrónico ya está registrado');
        }

        // Hash del password con bcrypt
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

        // TypeORM maneja automáticamente los undefined como null para columnas nullable
        const user = this.userRepository.create({
            ...createUserDto,
            password: hashedPassword,
            fechaCreacion: new Date(),
            estado: 1,
        });

        return this.userRepository.save(user);
    }

    /**
     * Actualiza un usuario existente
     */
    async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
        const user = await this.findByIdUnified(id) as User;

        if (!user) {
            throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
        }

        // Optimizado: Verificar email duplicado excluyendo al usuario actual
        if (updateUserDto.email && updateUserDto.email !== user.email) {
            const emailExists = await this.userRepository.exists({
                where: { email: updateUserDto.email, estado: 1, id: Not(id) }
            });
            if (emailExists) {
                throw new ConflictException('El correo electrónico ya está en uso');
            }
        }

        // Preparar datos: separar password para hashear y spread del resto
        const { password, ...restData } = updateUserDto;
        const updateData: Partial<User> = {
            ...restData,
            fechaModificacion: new Date(),
        };

        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        await this.userRepository.update(id, updateData);

        return this.findByIdUnified(id) as Promise<User>;
    }

    // Listas permitidas para "Scopes" dinámicos (estilo Laravel)
    private readonly allowedIncludes = ['regional', 'regional.zona', 'cargo', 'departamento', 'empresaUsuarios', 'usuarioPerfiles', 'etiquetasPropias', 'etiquetasAsignadas', 'role'];
    private readonly allowedFilters = ['nombre', 'apellido', 'email', 'cedula', 'estado', 'rolId', 'cargoId', 'regionalId', 'departamentoId'];

    /**
     * Búsqueda unificada de usuario por ID con opciones
     * Ahora reutiliza la lógica Maestra de findAllUnified para consistencia.
     */
    async findByIdUnified(id: number, options?: {
        included?: string;
    }): Promise<User | Record<string, unknown> | null> {
        // Reutilizamos findAllUnified filtrando por ID y aplicando includes
        const result = await this.findAllUnified({
            filter: { id }, // Filtro por ID
            limit: 1,
            included: options?.included,
        });

        const user = result as User;

        if (!user) {
            return null;
        }

        return user;
    }

    /**
     * **Búsqueda Maestra Unificada**
     * 
     * Reemplaza múltiples consultas legacy fragmentadas.
     * Permite buscar usuarios aplicando cualquier combinación de filtros.
     * @param options Opciones de filtrado y paginación (limit).
     */
    async findAllUnified(options?: {
        limit?: number;      // Para findOne legacy
        included?: string; // ej: 'regional,cargo'
        filter?: Record<string, any>; // ej: { nombre: 'Juan' }
    }): Promise<User[] | Record<string, unknown>[] | User | null> {
        const qb = this.userRepository.createQueryBuilder('user');

        // Filtros base (Primero, para que applyFilters use andWhere sobre esto)
        qb.where('user.estado = :estado', { estado: 1 });

        // 1. Scopes Dinámicos (Estilo Laravel)
        // Aplica relaciones (joins) automáticamente si están permitidas
        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'user');
        // Aplica filtros (where like) automáticamente si están permitidos
        ApiQueryHelper.applyFilters(qb, options?.filter, this.allowedFilters, 'user');

        // Ordenamiento default
        qb.orderBy('user.nombre', 'ASC');

        // Paginación Standard
        ApiQueryHelper.applyPagination(qb, { limit: options?.limit });

        // Retornar uno o todos
        if (options?.limit === 1) {
            return qb.getOne();
        }

        return qb.getMany();
    }



    /**
     * Obtiene usuarios por lista de IDs con datos de regional
     * Basado en: get_usuarios_por_ids del modelo legacy PHP
     */
    async findByIds(userIds: number[]): Promise<Record<string, unknown>[]> {
        if (userIds.length === 0) {
            return [];
        }

        return this.userRepository.query(
            `SELECT u.usu_id, u.usu_nom, u.usu_ape, u.usu_correo, r.reg_nom
             FROM tm_usuario u
             LEFT JOIN tm_regional r ON u.reg_id = r.reg_id
             WHERE u.usu_id IN (?) AND u.est = 1`,
            [userIds],
        );
    }



    /**
     * Elimina un usuario (soft delete)
     * Basado en: delete_usuario del modelo legacy PHP
     * No elimina físicamente, solo marca est=0 y fech_elim=NOW()
     */
    async delete(id: number): Promise<{ deleted: boolean; id: number }> {
        const user = await this.findByIdUnified(id);

        if (!user) {
            throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
        }

        await this.userRepository.update(id, {
            estado: 0,
            fechaEliminacion: new Date(),
        });

        return { deleted: true, id };
    }



    /**
     * Actualiza la firma de un usuario
     * Basado en: update_firma del modelo legacy PHP
     */
    async updateFirma(id: number, firma: string): Promise<{ updated: boolean; id: number }> {
        const user = await this.findByIdUnified(id);

        if (!user) {
            throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
        }

        await this.userRepository.update(id, { firma });

        return { updated: true, id };
    }

    /**
     * Sincroniza perfiles de un usuario
     * Basado en: insert_usuario_perfil del modelo legacy PHP
     * 1. Elimina perfiles existentes del usuario
     * 2. Inserta los nuevos perfiles
     */
    async syncPerfiles(userId: number, perfilIds: number[]): Promise<{ synced: boolean; userId: number; perfilCount: number }> {
        const user = await this.findByIdUnified(userId);

        if (!user) {
            throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
        }

        await this.dataSource.transaction(async (manager) => {
            // 1. Eliminar perfiles existentes
            await manager.delete(UsuarioPerfil, { usuarioId: userId });

            // 2. Insertar nuevos perfiles
            if (perfilIds && perfilIds.length > 0) {
                const nuevosPerfiles = perfilIds
                    .filter(pid => pid) // Filtrar nulos/ceros
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

    /**
     * Obtiene los perfiles de un usuario
     * Basado en: get_perfiles_por_usuario del modelo legacy PHP
     * JOIN con tm_perfil para obtener nombre del perfil
     */
    async getPerfiles(userId: number): Promise<Record<string, unknown>[]> {
        const user = await this.userRepository.findOne({
            where: { id: userId, estado: 1 },
            relations: ['usuarioPerfiles', 'usuarioPerfiles.perfil'],
        });

        if (!user || !user.usuarioPerfiles) {
            return [];
        }

        // Mapear al formato esperado por el frontend (id, nombre)
        return user.usuarioPerfiles
            .filter(up => up.estado === 1 && up.perfil)
            .map(up => ({
                per_id: up.perfil.id,
                per_nom: up.perfil.nombre
            }));
    }
}




