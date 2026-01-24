import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organigrama } from './entities/organigrama.entity';
import { CreateOrganigramaDto } from './dto/create-organigrama.dto';
import { UpdateOrganigramaDto } from './dto/update-organigrama.dto';
import { ApiQueryHelper, PaginatedResult } from '../../common/utils/api-query-helper';

@Injectable()
export class OrganigramaService {
    private readonly allowedIncludes = ['cargo', 'jefeCargo'];
    private readonly allowedFilters = ['cargoId', 'jefeCargoId', 'estado'];

    constructor(
        @InjectRepository(Organigrama)
        private readonly organigramaRepository: Repository<Organigrama>,
    ) { }

    async list(options?: {
        limit?: number;
        page?: number;
        included?: string;
        filter?: Record<string, any>;
    }): Promise<PaginatedResult<Organigrama>> {
        const qb = this.organigramaRepository.createQueryBuilder('organigrama');

        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'organigrama');
        ApiQueryHelper.applyFilters(qb, options?.filter, this.allowedFilters, 'organigrama');

        qb.orderBy('organigrama.id', 'ASC');

        return ApiQueryHelper.paginate(qb, { limit: options?.limit, page: options?.page });
    }

    async show(id: number, options?: { included?: string }): Promise<Organigrama> {
        const qb = this.organigramaRepository.createQueryBuilder('organigrama');

        qb.where('organigrama.id = :id', { id });

        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'organigrama');

        const organigrama = await qb.getOne();

        if (!organigrama) {
            throw new NotFoundException(`Organigrama con ID ${id} no encontrado`);
        }

        return organigrama;
    }

    async create(createDto: CreateOrganigramaDto): Promise<Organigrama> {
        // Validar unicidad (un cargo solo debe tener un jefe en el organigrama activo? O puede reportar a multiples?)
        // Asumiremos que un cargo puede tener múltiples reportes en la tabla (según el modelo legacy que permite duplicados a veces),
        // pero idealmente deberíamos validar. Por ahora validamos duplicado exacto.
        const exists = await this.organigramaRepository.findOne({
            where: {
                cargoId: createDto.cargoId,
                jefeCargoId: createDto.jefeCargoId,
                estado: 1
            }
        });

        if (exists) {
            throw new ConflictException('Esta relación de organigrama ya existe');
        }

        const organigrama = this.organigramaRepository.create({
            ...createDto,
            estado: createDto.estado ?? 1
        });

        return this.organigramaRepository.save(organigrama);
    }

    async update(id: number, updateDto: UpdateOrganigramaDto): Promise<Organigrama> {
        const organigrama = await this.show(id);

        this.organigramaRepository.merge(organigrama, updateDto);

        return this.organigramaRepository.save(organigrama);
    }

    async delete(id: number): Promise<{ deleted: boolean; id: number }> {
        await this.show(id);

        await this.organigramaRepository.update(id, { estado: 0 });

        return { deleted: true, id };
    }
}
