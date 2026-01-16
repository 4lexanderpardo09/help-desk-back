import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    /**
     * Crea un nuevo usuario
     * Basado en: insert_usuario del modelo legacy PHP
     */
    async create(createUserDto: CreateUserDto): Promise<User> {
        // Verificar si el email ya existe
        const existingUser = await this.findByEmail(createUserDto.email);
        if (existingUser) {
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
        const user = await this.findById(id);

        if (!user) {
            throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
        }

        // Si se envía un nuevo email, verificar que no esté en uso por otro usuario
        if (updateUserDto.email && updateUserDto.email !== user.email) {
            const existingUser = await this.findByEmail(updateUserDto.email);
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

        return this.findById(id) as Promise<User>;
    }

    /**
     * Busca un usuario por email
     */
    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({
            where: { email, estado: 1 },
        });
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
    async findByIdUnified(id: number, options?: {
        includeEmpresas?: boolean;
    }): Promise<User | Record<string, unknown> | null> {
        if (options?.includeEmpresas) {
            const result = await this.userRepository.query(
                `SELECT 
                    u.usu_id, u.usu_nom, u.usu_ape, u.usu_correo, 
                    u.rol_id, u.dp_id, u.reg_id, u.car_id, 
                    u.es_nacional, u.usu_firma,
                    GROUP_CONCAT(eu.emp_id) as emp_ids
                 FROM tm_usuario u
                 LEFT JOIN empresa_usuario eu ON u.usu_id = eu.usu_id
                 WHERE u.usu_id = ?
                 GROUP BY u.usu_id`,
                [id],
            );
            return result[0] || null;
        }

        return this.userRepository.findOne({
            where: { id, estado: 1 },
        });
    }

    // ===============================================
    // MÉTODOS LEGACY (usar findByIdUnified en su lugar)
    // ===============================================

    /**
     * @deprecated Usar findByIdUnified(id)
     */
    async findById(id: number): Promise<User | null> {
        return this.userRepository.findOne({
            where: { id, estado: 1 },
        });
    }

    /**
     * @deprecated Usar findByIdUnified(id, { includeEmpresas: true })
     */
    async findByIdWithEmpresas(id: number): Promise<Record<string, unknown> | null> {
        const result = await this.userRepository.query(
            `SELECT 
                u.usu_id, u.usu_nom, u.usu_ape, u.usu_correo, 
                u.rol_id, u.dp_id, u.reg_id, u.car_id, 
                u.es_nacional, u.usu_firma,
                GROUP_CONCAT(eu.emp_id) as emp_ids
             FROM tm_usuario u
             LEFT JOIN empresa_usuario eu ON u.usu_id = eu.usu_id
             WHERE u.usu_id = ?
             GROUP BY u.usu_id`,
            [id],
        );
        return result[0] || null;
    }

    /**
     * Obtiene todos los usuarios activos
     */
    async findAll(): Promise<User[]> {
        return this.userRepository.find({
            where: { estado: 1 },
            order: { nombre: 'ASC' },
        });
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
        if (departamentoId === null) {
            return this.userRepository
                .createQueryBuilder('user')
                .where('user.departamentoId IS NULL')
                .andWhere('user.estado = :estado', { estado: 1 })
                .orderBy('user.nombre', 'ASC')
                .getMany();
        }

        return this.userRepository.find({
            where: { departamentoId, estado: 1 },
            order: { nombre: 'ASC' },
        });
    }

    /**
     * Elimina un usuario (soft delete)
     * Basado en: delete_usuario del modelo legacy PHP
     * No elimina físicamente, solo marca est=0 y fech_elim=NOW()
     */
    async delete(id: number): Promise<{ deleted: boolean; id: number }> {
        const user = await this.findById(id);

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
     * Obtiene todos los usuarios con datos del departamento
     * Basado en: get_usuario que ejecuta sp_l_usuario_01
     * El SP hace: LEFT JOIN tm_departamento WHERE est=1
     */
    async getAllWithDepartamento(): Promise<Record<string, unknown>[]> {
        const result = await this.userRepository.query('CALL sp_l_usuario_01()');
        // MySQL devuelve el resultado en result[0]
        return result[0] || [];
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
    async findByCargoUnified(options: {
        cargoId: number;
        regionalId?: number;
        zona?: string;
        includeNacional?: boolean;
        limit?: number;
    }): Promise<User[] | User | null> {
        const { cargoId, regionalId, zona, includeNacional, limit } = options;

        // Caso especial: búsqueda por zona requiere JOINs
        if (zona) {
            const result = await this.userRepository.query(
                `SELECT u.* 
                 FROM tm_usuario u
                 INNER JOIN tm_regional r ON u.reg_id = r.reg_id
                 INNER JOIN tm_zona z ON r.zona_id = z.zona_id
                 WHERE u.car_id = ? AND z.zona_nom = ? AND u.est = 1
                 ${limit ? `LIMIT ${limit}` : ''}`,
                [cargoId, zona],
            );
            return limit === 1 ? (result[0] || null) : result;
        }

        // Query builder para los demás casos
        const qb = this.userRepository
            .createQueryBuilder('user')
            .where('user.cargoId = :cargoId', { cargoId })
            .andWhere('user.estado = :estado', { estado: 1 });

        // Filtro por regional (con o sin nacionales)
        if (regionalId !== undefined) {
            if (includeNacional) {
                qb.andWhere('(user.regionalId = :regionalId OR user.esNacional = 1)', { regionalId });
            } else {
                qb.andWhere('user.regionalId = :regionalId', { regionalId });
            }
        }

        qb.orderBy('user.nombre', 'ASC');

        // Retornar uno o todos
        if (limit === 1) {
            return qb.getOne();
        }

        return qb.getMany();
    }

    // ===============================================
    // MÉTODOS LEGACY (usar findByCargoUnified en su lugar)
    // Se mantienen para compatibilidad con endpoints actuales
    // ===============================================

    /**
     * @deprecated Usar findByCargoUnified({ cargoId })
     */
    async findByCargo(cargoId: number): Promise<Record<string, unknown>[]> {
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
        return this.userRepository.findOne({
            where: { cargoId, regionalId, estado: 1 },
        });
    }

    /**
     * @deprecated Usar findByCargoUnified({ cargoId, regionalId })
     */
    async findAllByCargoAndRegional(cargoId: number, regionalId: number): Promise<User[]> {
        return this.userRepository.find({
            where: { cargoId, regionalId, estado: 1 },
            order: { nombre: 'ASC' },
        });
    }

    /**
     * @deprecated Usar findByCargoUnified({ cargoId, limit: 1 })
     */
    async findOneByCargo(cargoId: number): Promise<User | null> {
        return this.userRepository.findOne({
            where: { cargoId, estado: 1 },
        });
    }

    /**
     * @deprecated Usar findByCargoUnified({ cargoId, regionalId, includeNacional: true })
     */
    async findByCargoRegionalOrNacional(cargoId: number, regionalId: number): Promise<User[]> {
        return this.userRepository
            .createQueryBuilder('user')
            .where('user.cargoId = :cargoId', { cargoId })
            .andWhere('(user.regionalId = :regionalId OR user.esNacional = 1)', { regionalId })
            .andWhere('user.estado = :estado', { estado: 1 })
            .orderBy('user.nombre', 'ASC')
            .getMany();
    }

    /**
     * @deprecated Usar findByCargoUnified({ cargoId, zona, limit: 1 })
     */
    async findByCargoAndZona(cargoId: number, zonaNombre: string): Promise<Record<string, unknown> | null> {
        const result = await this.userRepository.query(
            `SELECT u.* 
             FROM tm_usuario u
             INNER JOIN tm_regional r ON u.reg_id = r.reg_id
             INNER JOIN tm_zona z ON r.zona_id = z.zona_id
             WHERE u.car_id = ? AND z.zona_nom = ? AND u.est = 1
             LIMIT 1`,
            [cargoId, zonaNombre],
        );
        return result[0] || null;
    }

    /**
     * Obtiene usuarios por rol
     * Basado en: get_usuario_x_rol del modelo legacy PHP
     * Nota: El legacy hardcodea rol_id=2, aquí lo hacemos dinámico
     */
    async findByRol(rolId: number): Promise<User[]> {
        return this.userRepository.find({
            where: { rolId, estado: 1 },
            order: { nombre: 'ASC' },
        });
    }

    /**
     * Obtiene agentes (usuarios con rol_id = 2)
     * Wrapper para mantener compatibilidad con legacy get_usuario_x_rol
     */
    async findAgentes(): Promise<User[]> {
        return this.findByRol(2);
    }

    /**
     * Actualiza la firma de un usuario
     * Basado en: update_firma del modelo legacy PHP
     */
    async updateFirma(id: number, firma: string): Promise<{ updated: boolean; id: number }> {
        const user = await this.findById(id);

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
        const user = await this.findById(userId);

        if (!user) {
            throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
        }

        // 1. Eliminar perfiles existentes
        await this.userRepository.query(
            'DELETE FROM tm_usuario_perfiles WHERE usu_id = ?',
            [userId],
        );

        // 2. Insertar nuevos perfiles
        if (perfilIds && perfilIds.length > 0) {
            for (const perfilId of perfilIds) {
                if (perfilId) {
                    await this.userRepository.query(
                        'INSERT INTO tm_usuario_perfiles (usu_id, per_id, est) VALUES (?, ?, 1)',
                        [userId, perfilId],
                    );
                }
            }
        }

        return { synced: true, userId, perfilCount: perfilIds?.length || 0 };
    }

    /**
     * Obtiene los perfiles de un usuario
     * Basado en: get_perfiles_por_usuario del modelo legacy PHP
     * JOIN con tm_perfil para obtener nombre del perfil
     */
    async getPerfiles(userId: number): Promise<Record<string, unknown>[]> {
        return this.userRepository.query(
            `SELECT p.per_id, p.per_nom 
             FROM tm_usuario_perfiles up
             JOIN tm_perfil p ON up.per_id = p.per_id
             WHERE up.usu_id = ? AND up.est = 1`,
            [userId],
        );
    }
}




