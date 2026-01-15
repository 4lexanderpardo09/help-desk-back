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
     * Obtiene todos los usuarios activos
     */
    async findAll(): Promise<User[]> {
        return this.userRepository.find({
            where: { estado: 1 },
            order: { nombre: 'ASC' },
        });
    }

    /**
     * Busca usuarios por departamento
     */
    async findByDepartamento(departamentoId: number): Promise<User[]> {
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
}
