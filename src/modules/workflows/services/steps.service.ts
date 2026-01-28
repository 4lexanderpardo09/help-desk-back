import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasoFlujo } from '../entities/paso-flujo.entity';
import { PasoFlujoUsuario } from '../entities/paso-flujo-usuario.entity';
import { CreatePasoFlujoDto } from '../dto/create-paso-flujo.dto';
import { UpdatePasoFlujoDto } from '../dto/update-paso-flujo.dto';
import { PasoFlujoFirma } from '../entities/paso-flujo-firma.entity';
import { CampoPlantilla } from '../../templates/entities/campo-plantilla.entity';
import { ApiQueryHelper, PaginatedResult } from '../../../common/utils/api-query-helper';

@Injectable()
export class StepsService {
    constructor(
        @InjectRepository(PasoFlujo)
        private readonly pasoRepo: Repository<PasoFlujo>,
        @InjectRepository(PasoFlujoUsuario)
        private readonly pasoUsuarioRepo: Repository<PasoFlujoUsuario>,
        @InjectRepository(PasoFlujoFirma)
        private readonly firmaRepo: Repository<PasoFlujoFirma>,
        @InjectRepository(CampoPlantilla)
        private readonly campoRepo: Repository<CampoPlantilla>,
    ) { }

    private readonly allowedIncludes = ['flujo', 'cargoAsignado', 'firmas', 'campos', 'usuarios'];
    private readonly allowedFilters = ['nombre', 'estado', 'flujo.id', 'esAprobacion', 'esTareaNacional'];

    /**
     * Lists steps with filtration and pagination.
     * Supports filtering by `filter[flujo.id]` to list steps of a specific flow.
     */
    async list(options?: {
        limit?: number;
        page?: number;
        included?: string;
        filter?: Record<string, any>;
    }): Promise<PaginatedResult<PasoFlujo>> {
        const qb = this.pasoRepo.createQueryBuilder('paso');

        // Base Filter: Active by default (1)
        qb.where('paso.estado = :estado', { estado: 1 });

        // Apply Includes and Filters
        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'paso');
        ApiQueryHelper.applyFilters(qb, options?.filter, this.allowedFilters, 'paso');

        // Sort by Order by default
        qb.orderBy('paso.orden', 'ASC');

        return ApiQueryHelper.paginate(qb, { limit: options?.limit, page: options?.page });
    }

    /**
     * Finds a single Step by ID.
     */
    async show(id: number, options?: { included?: string }): Promise<PasoFlujo> {
        const qb = this.pasoRepo.createQueryBuilder('paso')
            .where('paso.id = :id', { id })
            .andWhere('paso.estado = :estado', { estado: 1 });

        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'paso');

        const step = await qb.getOne();

        if (!step) throw new NotFoundException(`Step with ID ${id} not found`);
        return step;
    }

    async create(dto: CreatePasoFlujoDto) {
        const { usuariosEspecificos, ...stepData } = dto;
        const step = this.pasoRepo.create({ ...stepData, estado: 1 });
        const savedStep = await this.pasoRepo.save(step);

        if (usuariosEspecificos && usuariosEspecificos.length > 0) {
            const users = usuariosEspecificos.map(uid => this.pasoUsuarioRepo.create({
                pasoId: savedStep.id,
                usuarioId: uid,
            }));
            await this.pasoUsuarioRepo.save(users);
        }

        return savedStep;
    }

    async update(id: number, dto: UpdatePasoFlujoDto) {
        const { usuariosEspecificos, firmas, campos, ...stepData } = dto;

        // Only update scalar fields (exclude OneToMany relations)
        await this.pasoRepo.update(id, stepData);

        if (usuariosEspecificos !== undefined) {
            // Sync users: Delete existing and add new
            await this.pasoUsuarioRepo.delete({ pasoId: id });

            if (usuariosEspecificos.length > 0) {
                const users = usuariosEspecificos.map(uid => this.pasoUsuarioRepo.create({
                    pasoId: id,
                    usuarioId: uid,
                }));
                await this.pasoUsuarioRepo.save(users);
            }
        }

        // Detect changes in signatures
        if (firmas !== undefined) {
            await this.firmaRepo.delete({ pasoId: id });
            if (firmas.length > 0) {
                // Determine clean objects
                const newFirmas = this.firmaRepo.create(firmas.map((f: any) => ({ ...f, pasoId: id })));
                await this.firmaRepo.save(newFirmas);
            }
        }

        // Detect changes in template fields
        if (campos !== undefined) {
            // Because CampoPlantilla might be used loosely, assume simpler replacement model for this Step context
            await this.campoRepo.delete({ pasoId: id });
            if (campos.length > 0) {
                const newCampos = this.campoRepo.create(campos.map((c: any) => ({ ...c, pasoId: id })));
                await this.campoRepo.save(newCampos);
            }
        }

        return this.show(id);
    }

    async delete(id: number) {
        const result = await this.pasoRepo.update(id, { estado: 0 });
        if (result.affected === 0) {
            throw new NotFoundException(`Step with ID ${id} not found`);
        }
        return { deleted: true, id };
    }

    /**
     * Legacy support wrapper (optional, or we remove it if Controller is updated)
     * The controller asks for `findStepsByFlujo`. I will update controller to use `list` with filter,
     * but if other modules use this service, they might need it.
     * I'll leave it or replace implementation.
     */
    async findStepsByFlujo(flujoId: number) {
        return this.list({
            limit: 100, // No limit usually? Or high limit
            filter: { 'flujo.id': flujoId }
        }).then(res => res.data);
    }
}
