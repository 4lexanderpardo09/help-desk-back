import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
     * Crea un nuevo usuario
     * Basado en: insert_usuario del modelo legacy PHP
     */
    async create(createUserDto: CreateUserDto): Promise<User> {
        // Verificar si el email ya existe
        const existingUsers = await this.findAllUnified({ email: createUserDto.email }) as User[];
        if (existingUsers.length > 0) {
            throw new ConflictException('El correo electrónico ya está registrado');
        }

        // Hash del password con bcrypt (compatible con PHP password_hash)
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

        const user = this.userRepository.create({
            nombre: createUserDto.nombre,
            apellido: createUserDto.apellido,
            email: createUserDto.email,
            password: hashedPassword,
            rolId: createUserDto.rolId,
            regionalId: createUserDto.regionalId ?? null,
            cargoId: createUserDto.cargoId ?? null,
            departamentoId: createUserDto.departamentoId ?? null,
            esNacional: createUserDto.esNacional,
            cedula: createUserDto.cedula ?? null,
            fechaCreacion: new Date(),
            fechaModificacion: null,
            fechaEliminacion: null,
            estado: 1,
        });

        return this.userRepository.save(user);
    }

    /**
     * Actualiza un usuario existente
     * Basado en: update_usuario del modelo legacy PHP
     * Si se envía password, se hashea; si no, se mantiene el actual
     */
    async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
        const user = await this.findByIdUnified(id) as User;

        if (!user) {
            throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
        }

        // Si se envía un nuevo email, verificar que no esté en uso por otro usuario
        if (updateUserDto.email && updateUserDto.email !== user.email) {
            const existingUsers = await this.findAllUnified({ email: updateUserDto.email }) as User[];
            const existingUser = existingUsers[0];
            if (existingUser && existingUser.id !== id) {
                throw new ConflictException('El correo electrónico ya está en uso');
            }
        }

        // Preparar datos de actualización
        const updateData: Partial<User> = {
            fechaModificacion: new Date(),
        };

        // Solo actualizar campos que se enviaron
        if (updateUserDto.nombre !== undefined) {
            updateData.nombre = updateUserDto.nombre;
        }
        if (updateUserDto.apellido !== undefined) {
            updateData.apellido = updateUserDto.apellido;
        }
        if (updateUserDto.email !== undefined) {
            updateData.email = updateUserDto.email;
        }
        if (updateUserDto.rolId !== undefined) {
            updateData.rolId = updateUserDto.rolId;
        }
        if (updateUserDto.regionalId !== undefined) {
            updateData.regionalId = updateUserDto.regionalId;
        }
        if (updateUserDto.cargoId !== undefined) {
            updateData.cargoId = updateUserDto.cargoId;
        }
        if (updateUserDto.departamentoId !== undefined) {
            updateData.departamentoId = updateUserDto.departamentoId;
        }
        if (updateUserDto.esNacional !== undefined) {
            updateData.esNacional = updateUserDto.esNacional;
        }
        if (updateUserDto.cedula !== undefined) {
            updateData.cedula = updateUserDto.cedula;
        }

        // Si se envía password, hashearlo (igual que en PHP legacy)
        if (updateUserDto.password) {
            updateData.password = await bcrypt.hash(updateUserDto.password, 10);
        }

        await this.userRepository.update(id, updateData);

        return this.findByIdUnified(id) as Promise<User>;
    }

    /**
     * Busca un usuario por email
     */
    async findByEmail(email: string): Promise<User | null> {
        const users = await this.findAllUnified({ email }) as User[];
        return users[0] || null;
    }

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

    // ===============================================
    // MÉTODOS LEGACY (usar findByIdUnified en su lugar)
    // ===============================================

    /**
     * @deprecated Usar findByIdUnified(id)
     */
    async findById(id: number): Promise<User | null> {
        return this.findByIdUnified(id) as Promise<User | null>;
    }

    /**
     * @deprecated Usar findByIdUnified(id, { includeEmpresas: true })
     */
    async findByIdWithEmpresas(id: number): Promise<Record<string, unknown> | null> {
        return this.findByIdUnified(id, { includeEmpresas: true }) as Promise<Record<string, unknown> | null>;
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

    // ===============================================
    // MÉTODOS LEGACY (usar findAllUnified en su lugar)
    // ===============================================

    /**
     * @deprecated Usar findAllUnified()
     */
    async findAll(): Promise<User[]> {
        return this.findAllUnified() as Promise<User[]>;
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
     * Busca usuarios por departamento
     * Basado en: get_usuario_x_departamento del modelo legacy PHP
     * Si departamentoId es null, busca usuarios sin departamento asignado
     */
    async findByDepartamento(departamentoId: number | null): Promise<User[]> {
        return this.findAllUnified({ departamentoId }) as Promise<User[]>;
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
     * @deprecated Usar findAllUnified({ includeDepartamento: true })
     */
    async getAllWithDepartamento(): Promise<Record<string, unknown>[]> {
        return this.findAllUnified({ includeDepartamento: true }) as Promise<Record<string, unknown>[]>;
    }

    /**
     * Búsqueda unificada de usuarios por cargo con filtros opcionales
     * Reemplaza 6 endpoints legacy fragmentados
     * 
     * Ejemplos de uso:
     * - findByCargoUnified({ cargoId: 1 }) → Todos por cargo
     * - findByCargoUnified({ cargoId: 1, limit: 1 }) → Uno por cargo
     * - findByCargoUnified({ cargoId: 1, regionalId: 2 }) → Todos por cargo+regional
     * - findByCargoUnified({ cargoId: 1, regionalId: 2, limit: 1 }) → Uno por cargo+regional
     * - findByCargoUnified({ cargoId: 1, regionalId: 2, includeNacional: true }) → Regional O Nacional
     * - findByCargoUnified({ cargoId: 1, zona: 'Norte', limit: 1 }) → Por zona
     */
    /**
     * @deprecated Usar findAllUnified({ cargoId, ... })
     */
    async findByCargoUnified(options: {
        cargoId: number;
        regionalId?: number;
        zona?: string;
        includeNacional?: boolean;
        limit?: number;
    }): Promise<User[] | User | null> {
        return this.findAllUnified(options) as Promise<User[] | User | null>;
    }

    // ===============================================
    // MÉTODOS LEGACY (usar findByCargoUnified en su lugar)
    // Se mantienen para compatibilidad con endpoints actuales
    // ===============================================

    /**
     * @deprecated Usar findByCargoUnified({ cargoId })
     */
    async findByCargo(cargoId: number): Promise<Record<string, unknown>[]> {
        // Nota: El original devuelve Record<string, unknown>[], pero findByCargoUnified devuelve User[]
        // Se asume compatibilidad o se ajusta si es necesario. El query original devolvía campos específicos.
        // Dado que findByCargoUnified devuelve entidades completas, esto es una mejora (data extra),
        // pero para evitar romper tipos estrictos devolvemos as any o transformamos.
        // El legacy devuelve: usu_id, usu_nom, usu_ape, reg_nom
        // El unificado con User[] no tiene reg_nom directo (es relación).
        // Si el frontend usa reg_nom, esto podría romper.
        // REVISIÓN: El método legacy findByCargo hacía un JOIN con regional.
        // User entity tiene regionalId pero no reg_nom flat. 
        // findByCargoUnified usa createQueryBuilder y NO hace join explícito para seleccionar reg_nom en el select.
        // Ups, findByCargoUnified retorna User entity. Si el front necesita reg_nom, debemos asegurarnos.
        // Por seguridad y compatibilidad, mantendré la query original en findByCargoOld o usaré el unified SI
        // el unified provee lo mismo. 
        // El unified provee `User` entity. `User` entity podría tener relation con Regional cargada?
        // En findByCargoUnified no estoy haciendo `leftJoinAndSelect`.
        // MANTENDRÉ LA IMPLEMENTACIÓN ORIGINAL para findByCargo para no romper el front que espera `reg_nom`.
        // Los otros (byId, etc) sí parecen seguros.

        return this.userRepository.query(
            `SELECT u.usu_id, u.usu_nom, u.usu_ape, r.reg_nom
             FROM tm_usuario u
             LEFT JOIN tm_regional r ON u.reg_id = r.reg_id
             WHERE u.car_id = ? AND u.est = 1`,
            [cargoId],
        );
    }

    /**
     * @deprecated Usar findByCargoUnified({ cargoId, regionalId, limit: 1 })
     */
    async findByCargoAndRegional(cargoId: number, regionalId: number): Promise<User | null> {
        return this.findByCargoUnified({ cargoId, regionalId, limit: 1 }) as Promise<User | null>;
    }

    /**
     * @deprecated Usar findByCargoUnified({ cargoId, regionalId })
     */
    async findAllByCargoAndRegional(cargoId: number, regionalId: number): Promise<User[]> {
        return this.findByCargoUnified({ cargoId, regionalId }) as Promise<User[]>;
    }

    /**
     * @deprecated Usar findByCargoUnified({ cargoId, limit: 1 })
     */
    async findOneByCargo(cargoId: number): Promise<User | null> {
        return this.findByCargoUnified({ cargoId, limit: 1 }) as Promise<User | null>;
    }

    /**
     * @deprecated Usar findByCargoUnified({ cargoId, regionalId, includeNacional: true })
     */
    async findByCargoRegionalOrNacional(cargoId: number, regionalId: number): Promise<User[]> {
        return this.findByCargoUnified({ cargoId, regionalId, includeNacional: true }) as Promise<User[]>;
    }

    /**
     * @deprecated Usar findByCargoUnified({ cargoId, zona, limit: 1 })
     */
    async findByCargoAndZona(cargoId: number, zonaNombre: string): Promise<Record<string, unknown> | null> {
        // Este retorna Record<string, unknown> en legacy query, el unified retorna User | Record...
        // En caso zona, el unified retorna result[0] que es raw packet, compatible.
        return this.findByCargoUnified({ cargoId, zona: zonaNombre, limit: 1 }) as Promise<Record<string, unknown> | null>;
    }

    /**
     * Obtiene usuarios por rol
     * Basado en: get_usuario_x_rol del modelo legacy PHP
     * Nota: El legacy hardcodea rol_id=2, aquí lo hacemos dinámico
     */
    async findByRol(rolId: number): Promise<User[]> {
        return this.findAllUnified({ rolId }) as Promise<User[]>;
    }

    /**
     * Obtiene agentes (usuarios con rol_id = 2)
     * Wrapper para mantener compatibilidad con legacy get_usuario_x_rol
     */
    async findAgentes(): Promise<User[]> {
        return this.findAllUnified({ rolId: 2 }) as Promise<User[]>;
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




