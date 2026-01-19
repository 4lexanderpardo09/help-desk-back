import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consulta } from './entities/consulta.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ApiQueryHelper } from '../../common/utils/api-query-helper';

@Injectable()
export class ReportsService {
    constructor(
        @InjectRepository(Consulta)
        private readonly consultaRepository: Repository<Consulta>,
    ) { }

    // No hay relaciones complejas por defecto, pero dejamos la estructura lista
    private readonly allowedIncludes = [];
    private readonly allowedFilters = ['id', 'nombre', 'estado'];

    /**
     * Muestra un reporte por ID
     */
    async show(id: number): Promise<Consulta> {
        const consulta = await this.consultaRepository.findOne({
            where: { id, estado: 1 },
        });

        if (!consulta) {
            throw new NotFoundException(`Reporte con ID ${id} no encontrado`);
        }
        return consulta;
    }

    /**
     * Lista reportes con filtros y paginación
     */
    async list(options?: {
        limit?: number;
        page?: number;
        filter?: Record<string, any>;
        included?: string;
    }): Promise<Consulta[]> {
        const qb = this.consultaRepository.createQueryBuilder('consulta');

        qb.where('consulta.estado = :estado', { estado: 1 });

        ApiQueryHelper.applyFilters(qb, options?.filter, this.allowedFilters, 'consulta');
        ApiQueryHelper.applyPagination(qb, { limit: options?.limit, page: options?.page });

        qb.orderBy('consulta.id', 'DESC');

        return qb.getMany();
    }

    /**
     * Crea un nuevo reporte
     */
    async create(createDto: CreateReportDto): Promise<Consulta> {
        const existing = await this.consultaRepository.findOne({
            where: { nombre: createDto.nombre, estado: 1 },
        });

        if (existing) {
            throw new ConflictException(`Ya existe un reporte con el nombre '${createDto.nombre}'`);
        }

        const consulta = this.consultaRepository.create({
            ...createDto,
            estado: createDto.estado ?? 1,
        });

        return this.consultaRepository.save(consulta);
    }

    /**
     * Actualiza un reporte existente
     */
    async update(id: number, updateDto: UpdateReportDto): Promise<Consulta> {
        const consulta = await this.show(id);

        this.consultaRepository.merge(consulta, updateDto);
        return this.consultaRepository.save(consulta);
    }

    /**
     * Elimina un reporte (Soft Delete)
     */
    async delete(id: number): Promise<{ deleted: boolean; id: number }> {
        const consulta = await this.show(id);

        consulta.estado = 0;
        await this.consultaRepository.save(consulta);

        return { deleted: true, id };
    }
}
