import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ReglaMapeo } from './entities/regla-mapeo.entity';
import { ReglaCreadores } from './entities/regla-creadores.entity';
import { ReglaAsignados } from './entities/regla-asignados.entity';
import { ReglaCreadoresPerfil } from './entities/regla-creadores-perfil.entity';
import { CreateReglaMapeoDto } from './dto/create-regla-mapeo.dto';
import { UpdateReglaMapeoDto } from './dto/update-regla-mapeo.dto';
import { ApiQueryHelper } from '../../common/utils/api-query-helper';

@Injectable()
export class ReglasMapeoService {
    constructor(
        @InjectRepository(ReglaMapeo)
        private readonly reglaRepository: Repository<ReglaMapeo>,
        private readonly dataSource: DataSource,
    ) { }

    // Listas permitidas para "Scopes" dinámicos (estilo Laravel)
    private readonly allowedIncludes = ['subcategoria', 'creadores', 'creadores.cargo', 'asignados', 'asignados.cargo', 'creadoresPerfil', 'creadoresPerfil.perfil'];
    private readonly allowedFilters = ['id', 'subcategoriaId', 'estado'];

    /**
     * Busca una regla por ID
     * Permite incluir relaciones dinámicamente.
     */
    async show(id: number, options?: {
        included?: string;
    }): Promise<ReglaMapeo> {
        const qb = this.reglaRepository.createQueryBuilder('regla');

        qb.where('regla.id = :id', { id });
        qb.andWhere('regla.estado = :estado', { estado: 1 });

        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'regla');

        const regla = await qb.getOne();

        if (!regla) {
            throw new NotFoundException(`Regla con ID ${id} no encontrada`);
        }
        return regla;
    }

    /**
     * **Búsqueda Maestra Unificada**
     * 
     * Método único para listar reglas de mapeo.
     * Soporta filtros y paginación.
     */
    async list(options?: {
        limit?: number;
        included?: string;
        filter?: Record<string, any>;
        page?: number;
    }): Promise<ReglaMapeo[]> {
        const qb = this.reglaRepository.createQueryBuilder('regla');

        qb.where('regla.estado = :estado', { estado: 1 });

        ApiQueryHelper.applyIncludes(qb, options?.included, this.allowedIncludes, 'regla');
        ApiQueryHelper.applyFilters(qb, options?.filter, this.allowedFilters, 'regla');
        ApiQueryHelper.applyPagination(qb, { limit: options?.limit, page: options?.page });

        // Ordenamiento por defecto
        qb.orderBy('regla.id', 'DESC');

        return qb.getMany();
    }

    /**
     * Crea una nueva regla de mapeo con sus relaciones
     */
    async create(createDto: CreateReglaMapeoDto): Promise<ReglaMapeo> {
        // Verificar si ya existe regla para esta subcategoría
        const existing = await this.reglaRepository.exists({
            where: { subcategoriaId: createDto.subcategoriaId, estado: 1 }
        });

        if (existing) {
            throw new ConflictException(`Ya existe una regla para la subcategoría ${createDto.subcategoriaId}`);
        }

        return await this.dataSource.transaction(async (manager) => {
            // 1. Crear regla principal
            const regla = manager.create(ReglaMapeo, {
                subcategoriaId: createDto.subcategoriaId,
                estado: createDto.estado ?? 1,
            });
            const savedRegla = await manager.save(ReglaMapeo, regla);

            // 2. Sincronizar relaciones
            await this.syncRelations(manager, savedRegla.id, createDto);

            return savedRegla;
        });
    }

    /**
     * Actualiza una regla de mapeo existente (delete + insert para relaciones)
     */
    async update(id: number, updateDto: UpdateReglaMapeoDto): Promise<ReglaMapeo> {
        const regla = await this.show(id);

        return await this.dataSource.transaction(async (manager) => {
            // 1. Actualizar regla principal
            if (updateDto.subcategoriaId !== undefined) {
                regla.subcategoriaId = updateDto.subcategoriaId;
            }
            await manager.save(ReglaMapeo, regla);

            // 2. Borrar relaciones existentes
            await manager.delete(ReglaCreadores, { reglaId: id });
            await manager.delete(ReglaAsignados, { reglaId: id });
            await manager.delete(ReglaCreadoresPerfil, { reglaId: id });

            // 3. Re-insertar nuevas relaciones
            await this.syncRelations(manager, id, updateDto);

            return regla;
        });
    }

    /**
     * Elimina una regla (soft delete)
     */
    async delete(id: number): Promise<{ deleted: boolean; id: number }> {
        const regla = await this.show(id);

        await this.reglaRepository.update(id, { estado: 0 });

        return { deleted: true, id };
    }
    /**
     * Sincroniza las relaciones de una regla (helper transaccional)
     */
    private async syncRelations(
        manager: any,
        reglaId: number,
        dto: Partial<CreateReglaMapeoDto>
    ): Promise<void> {
        // Insertar cargos creadores
        if (dto.creadorCargoIds?.length) {
            const creadores = dto.creadorCargoIds.map(cargoId =>
                manager.create(ReglaCreadores, { reglaId, creadorCargoId: cargoId })
            );
            await manager.save(ReglaCreadores, creadores);
        }

        // Insertar perfiles creadores
        if (dto.creadorPerfilIds?.length) {
            const perfiles = dto.creadorPerfilIds.map(perfilId =>
                manager.create(ReglaCreadoresPerfil, {
                    reglaId,
                    creadorPerfilId: perfilId,
                    estado: 1,
                    fechaCreacion: new Date(),
                })
            );
            await manager.save(ReglaCreadoresPerfil, perfiles);
        }

        // Insertar cargos asignados
        if (dto.asignadoCargoIds?.length) {
            const asignados = dto.asignadoCargoIds.map(cargoId =>
                manager.create(ReglaAsignados, { reglaId, asignadoCargoId: cargoId })
            );
            await manager.save(ReglaAsignados, asignados);
        }
    }
}
