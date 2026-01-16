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
     * Busca un usuario por ID
     */
    async findById(id: number): Promise<User | null> {
        return this.userRepository.findOne({
            where: { id, estado: 1 },
        });
    }

    /**
     * Obtiene usuario por ID con empresas asociadas
     * Basado en: get_usuario_x_id del modelo legacy PHP
     * Incluye LEFT JOIN con empresa_usuario y GROUP_CONCAT de emp_ids
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
     * Obtiene usuarios por cargo con datos de regional
     * Basado en: get_usuarios_por_cargo del modelo legacy PHP
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
     * Obtiene un usuario por cargo y regional
     * Basado en: get_usuario_por_cargo_y_regional del modelo legacy PHP
     * Retorna solo el primer resultado (LIMIT 1)
     */
    async findByCargoAndRegional(cargoId: number, regionalId: number): Promise<User | null> {
        return this.userRepository.findOne({
            where: { cargoId, regionalId, estado: 1 },
        });
    }

    /**
     * Obtiene TODOS los usuarios por cargo y regional
     * Basado en: get_usuarios_por_cargo_y_regional_all del modelo legacy PHP
     */
    async findAllByCargoAndRegional(cargoId: number, regionalId: number): Promise<User[]> {
        return this.userRepository.find({
            where: { cargoId, regionalId, estado: 1 },
            order: { nombre: 'ASC' },
        });
    }

    /**
     * Obtiene UN usuario por cargo (el primero encontrado)
     * Basado en: get_usuario_por_cargo del modelo legacy PHP
     * Retorna solo el primer resultado (LIMIT 1)
     */
    async findOneByCargo(cargoId: number): Promise<User | null> {
        return this.userRepository.findOne({
            where: { cargoId, estado: 1 },
        });
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
}




