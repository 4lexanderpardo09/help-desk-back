import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

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
