import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa } from './entities/empresa.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { ApiQueryHelper } from 'src/common/utils/api-query-helper';

@Injectable()
export class CompaniesService {
    constructor(
        @InjectRepository(Empresa)
        private readonly companyRepo: Repository<Empresa>,
    ) { }

    // Listas permitidas para "Scopes" dinámicos
    // 'usuarios' y 'categorias' son ManyToMany
    private readonly allowedIncludes = ['tickets', 'usuarios', 'categorias', 'flujosPlantilla'];
    private readonly allowedFilters = ['nombre', 'estado'];

    /**
     * Lista las empresas aplicando filtros y paginación.
     */
    async list(options?: {
        limit?: number;
        page?: number;
        included?: string;
        filter?: Record<string, any>;
    }) {
        const qb = this.companyRepo.createQueryBuilder('company');

        // Filtro base: solo activos
        qb.where('company.estado = :estado', { estado: 1 });

        // Scopes dinámicos
        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'company');
        ApiQueryHelper.applyFilters(qb, options?.filter, this.allowedFilters, 'company');

        // Ordenamiento default
        qb.orderBy('company.nombre', 'ASC');

        // Paginación
        ApiQueryHelper.applyPagination(qb, { limit: options?.limit, page: options?.page });

        return qb.getMany();
    }

    /**
     * Busca una empresa por su ID.
     */
    async show(id: number, options?: { included?: string }): Promise<Empresa> {
        const qb = this.companyRepo.createQueryBuilder('company')
            .where('company.id = :id', { id })
            .andWhere('company.estado = :estado', { estado: 1 });

        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'company');

        const company = await qb.getOne();

        if (!company) {
            throw new NotFoundException(`Empresa con ID ${id} no encontrada`);
        }

        return company;
    }

    /**
     * Crea una nueva empresa.
     * Valida duplicados por nombre.
     * 
     * Las asociaciones con usuarios y categorías se manejan desde esas entidades.
     */
    async create(createDto: CreateCompanyDto): Promise<Empresa> {
        const exists = await this.companyRepo.findOne({
            where: { nombre: createDto.nombre, estado: 1 }
        });

        if (exists) {
            throw new ConflictException(`La empresa ${createDto.nombre} ya existe`);
        }

        const company = this.companyRepo.create({
            ...createDto,
            estado: createDto.estado ?? 1,
            fechaCreacion: new Date(),
        });

        return await this.companyRepo.save(company);
    }

    /**
     * Actualiza una empresa existente.
     */
    async update(id: number, updateDto: UpdateCompanyDto): Promise<Empresa> {
        const company = await this.show(id);

        this.companyRepo.merge(company, updateDto);

        return await this.companyRepo.save(company);
    }

    /**
     * Elimina lógicamente una empresa (Soft Delete).
     */
    async delete(id: number): Promise<{ deleted: boolean; id: number }> {
        const company = await this.show(id);

        company.estado = 0;
        company.fechaEliminacion = new Date();

        await this.companyRepo.save(company);

        return { deleted: true, id };
    }
}
