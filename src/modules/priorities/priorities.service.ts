import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prioridad } from './entities/prioridad.entity';
import { CreatePriorityDto } from './dto/create-priority.dto';
import { UpdatePriorityDto } from './dto/update-priority.dto';
import { ApiQueryHelper } from '../../common/utils/api-query-helper';

@Injectable()
export class PrioritiesService {
    // Definir campos permitidos para filtros y relaciones
    private readonly allowedIncludes = ['subcategoria', 'tickets'];
    private readonly allowedFilters = ['id', 'nombre', 'estado'];

    constructor(
        @InjectRepository(Prioridad)
        private readonly prioritiesRepository: Repository<Prioridad>,
    ) { }

    /**
     * Lista prioridades con filtros y paginación
     */
    async list(options?: {
        limit?: number;
        page?: number;
        included?: string;
        filter?: Record<string, any>;
    }): Promise<Prioridad[]> {
        const qb = this.prioritiesRepository.createQueryBuilder('prioridad');

        // Filtros base (estado activo por defecto si no se especifica)
        // qb.where('prioridad.estado = :estado', { estado: 1 }); // Comentado para permitir ver todos si es admin

        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'prioridad');
        ApiQueryHelper.applyFilters(qb, options?.filter, this.allowedFilters, 'prioridad');

        qb.orderBy('prioridad.id', 'ASC');

        ApiQueryHelper.applyPagination(qb, { limit: options?.limit, page: options?.page });

        return qb.getMany();
    }

    /**
     * Obtiene una prioridad por ID
     */
    async show(id: number, options?: { included?: string }): Promise<Prioridad | null> {
        const qb = this.prioritiesRepository.createQueryBuilder('prioridad');

        qb.where('prioridad.id = :id', { id });

        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'prioridad');

        const prioridad = await qb.getOne();

        if (!prioridad) {
            throw new NotFoundException(`Prioridad con ID ${id} no encontrada`);
        }

        return prioridad;
    }

    /**
     * Crea una nueva prioridad
     */
    async create(createDto: CreatePriorityDto): Promise<Prioridad> {
        // Validar nombre duplicado
        const exists = await this.prioritiesRepository.findOne({
            where: { nombre: createDto.nombre }
        });

        if (exists) {
            throw new ConflictException(`La prioridad ${createDto.nombre} ya existe`);
        }

        const prioridad = this.prioritiesRepository.create({
            ...createDto,
            estado: createDto.estado ?? 1
        });

        return this.prioritiesRepository.save(prioridad);
    }

    /**
     * Actualiza una prioridad
     */
    async update(id: number, updateDto: UpdatePriorityDto): Promise<Prioridad> {
        const prioridad = await this.show(id);

        this.prioritiesRepository.merge(prioridad, updateDto);

        return this.prioritiesRepository.save(prioridad);
    }

    /**
     * Soft delete (cambia estado a 0)
     */
    async delete(id: number): Promise<{ deleted: boolean; id: number }> {
        const prioridad = await this.show(id);

        await this.prioritiesRepository.update(id, { estado: 0 });

        return { deleted: true, id };
    }
}
