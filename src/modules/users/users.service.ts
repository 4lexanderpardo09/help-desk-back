import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DataSource } from 'typeorm';
import { UsuarioPerfil } from '../profiles/entities/usuario-perfil.entity';

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

    /**
     * Búsqueda unificada de usuario por ID con opciones
     * - includeEmpresas: true para incluir GROUP_CONCAT de emp_ids
     */
    /**
     * Búsqueda unificada de usuario por ID con opciones
     * - includeEmpresas: true para incluir relaciones con empresas
     */
    async findByIdUnified(id: number, options?: {
        includeEmpresas?: boolean;
    }): Promise<User | Record<string, unknown> | null> {
        const relations = [];
        if (options?.includeEmpresas) {
            relations.push('empresaUsuarios');
        }

        const user = await this.userRepository.findOne({
            where: { id, estado: 1 },
            relations: relations,
        });

        if (!user) {
            return null;
        }

        // Si se pidieron empresas, simulamos el comportamiento legacy de GROUP_CONCAT emp_ids
        // para mantener compatibilidad si el frontend lo espera como string "1,2,3"
        // aunque ahora devolvemos el objeto User enriquecido.
        if (options?.includeEmpresas) {
            const userWithLegacy = user as any;
            userWithLegacy.emp_ids = user.empresaUsuarios?.map(eu => eu.empresaId).join(',') || null;
            return userWithLegacy;
        }

        return user;
    }



    /**
     * **Búsqueda Maestra Unificada**
     * 
     * Reemplaza múltiples consultas legacy fragmentadas.
     * Permite buscar usuarios aplicando cualquier combinación de filtros.
     * 
     * Lógica especial:
     * - Si se provee `zona`, realiza JOINs con tm_regional y tm_zona.
     * - Si se provee `regionalId` y `includeNacional`, aplica lógica OR (regional = X OR esNacional = 1).
     * - Si `includeDepartamento` es true, realiza un raw query para incluir nombre del departamento (compatibilidad legacy).
     * 
     * @param options Opciones de filtrado y paginación (limit).
     */
    async findAllUnified(options?: {
        includeDepartamento?: boolean;
        departamentoId?: number | null; // null explícito para buscar users con dp_id IS NULL
        rolId?: number;
        email?: string;
        cargoId?: number;
        regionalId?: number;
        zona?: string;       // Nombre de zona
        includeNacional?: boolean;
        limit?: number;      // Para findOne legacy
    }): Promise<User[] | Record<string, unknown>[] | User | null> {
        const qb = this.userRepository.createQueryBuilder('user');

        // Filtros base
        qb.where('user.estado = :estado', { estado: 1 });

        // JOINs necesarios
        if (options?.zona) {
            qb.innerJoin('user.regional', 'regional');
            qb.innerJoin('regional.zona', 'zona');
            qb.andWhere('zona.nombre = :zona', { zona: options.zona });
        } else if (options?.includeDepartamento) {
            // Solo hacemos join si necesitamos datos del departamento
            qb.leftJoinAndSelect('user.departamento', 'departamento');
        }

        if (options?.email) {
            qb.andWhere('user.email = :email', { email: options.email });
        }

        if (options?.rolId) {
            qb.andWhere('user.rolId = :rolId', { rolId: options.rolId });
        }

        if (options?.cargoId) {
            qb.andWhere('user.cargoId = :cargoId', { cargoId: options.cargoId });
        }

        // Filtro de departamento (manejo especial para null)
        if (options?.departamentoId !== undefined) {
            if (options.departamentoId === null) {
                qb.andWhere('user.departamentoId IS NULL');
            } else {
                qb.andWhere('user.departamentoId = :departamentoId', { departamentoId: options.departamentoId });
            }
        }

        // Filtro por regional (con lógica de includeNacional para cargos)
        if (options?.regionalId !== undefined) {
            if (options.includeNacional) {
                qb.andWhere('(user.regionalId = :regionalId OR user.esNacional = 1)', { regionalId: options.regionalId });
            } else {
                qb.andWhere('user.regionalId = :regionalId', { regionalId: options.regionalId });
            }
        }

        // Ordenamiento default
        qb.orderBy('user.nombre', 'ASC');

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




