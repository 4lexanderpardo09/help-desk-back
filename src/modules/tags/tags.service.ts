import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Etiqueta } from './entities/etiqueta.entity';

@Injectable()
export class TagsService {
    constructor(
        @InjectRepository(Etiqueta)
        private readonly repo: Repository<Etiqueta>,
    ) { }

    async create(data: Partial<Etiqueta>, userId: number): Promise<Etiqueta> {
        const tag = this.repo.create({
            ...data,
            usuarioId: userId,
            fechaCreacion: new Date(),
            estado: 1
        });
        return this.repo.save(tag);
    }

    async findAllByUser(userId: number): Promise<Etiqueta[]> {
        return this.repo.find({
            where: { usuarioId: userId, estado: 1 },
            order: { nombre: 'ASC' }
        });
    }

    async update(id: number, data: Partial<Etiqueta>, userId: number): Promise<Etiqueta> {
        const tag = await this.repo.findOne({ where: { id, usuarioId: userId, estado: 1 } });
        if (!tag) throw new NotFoundException('Etiqueta no encontrada o no pertenece al usuario');

        Object.assign(tag, data);
        return this.repo.save(tag);
    }

    async delete(id: number, userId: number): Promise<void> {
        const tag = await this.repo.findOne({ where: { id, usuarioId: userId, estado: 1 } });
        if (!tag) throw new NotFoundException('Etiqueta no encontrada o no pertenece al usuario');

        tag.estado = 0;
        await this.repo.save(tag);
    }
}
