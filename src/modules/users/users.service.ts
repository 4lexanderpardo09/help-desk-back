import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

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
}
