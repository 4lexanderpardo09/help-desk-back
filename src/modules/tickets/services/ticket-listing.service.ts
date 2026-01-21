import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository, SelectQueryBuilder } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { TicketFilterDto, TicketView } from '../dto/ticket-filter.dto';
import { TicketListItemDto, TicketListResponseDto, TicketTagDto } from '../dto/ticket-list-item.dto';
import { TicketEtiqueta } from '../entities/ticket-etiqueta.entity';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class TicketListingService {
    constructor(
        @InjectRepository(Ticket)
        private readonly ticketRepository: Repository<Ticket>,
        @InjectRepository(TicketEtiqueta)
        private readonly ticketEtiquetaRepository: Repository<TicketEtiqueta>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    /**
     * Base query builder with common joins and selects
     */
    private getBaseQuery(): SelectQueryBuilder<Ticket> {
        return this.ticketRepository.createQueryBuilder('t')
            .leftJoinAndSelect('t.usuario', 'u')
            .leftJoinAndSelect('t.categoria', 'c')
            .leftJoinAndSelect('t.subcategoria', 'sc')
            //.leftJoinAndSelect('t.prioridad', 'p') // Prioridad might be null if legacy data is weird, but usually OK.
            .leftJoinAndSelect('t.regional', 'r')
            .leftJoinAndSelect('t.pasoActual', 'pa') // Incluir Paso Actual para ver SLA/Status
            .where('t.estado = 1'); // t.est = 1 (Active)
    }

    private applyFilters(qb: SelectQueryBuilder<Ticket>, filters: TicketFilterDto) {
        if (filters.search) {
            qb.andWhere(new Brackets(qb => {
                qb.where('t.titulo LIKE :search', { search: `%${filters.search}%` })
                    .orWhere('t.id = :id', { id: filters.search }) // Exact ID match if numeric
                    .orWhere('u.nombre LIKE :search', { search: `%${filters.search}%` })
                    .orWhere('u.apellido LIKE :search', { search: `%${filters.search}%` });
            }));
        }

        if (filters.status) {
            qb.andWhere('t.ticketEstado = :status', { status: filters.status });
        }

        if (filters.dateFrom) {
            qb.andWhere('t.fechaCreacion >= :dateFrom', { dateFrom: `${filters.dateFrom} 00:00:00` });
        }
        if (filters.dateTo) {
            qb.andWhere('t.fechaCreacion <= :dateTo', { dateTo: `${filters.dateTo} 23:59:59` });
        }

        if (filters.ticketId) {
            qb.andWhere('t.id = :ticketId', { ticketId: filters.ticketId });
        }

        if (filters.categoryId) {
            qb.andWhere('t.categoriaId = :catId', { catId: filters.categoryId });
        }

        if (filters.subcategoryId) {
            qb.andWhere('t.subcategoriaId = :scatId', { scatId: filters.subcategoryId });
        }

        if (filters.companyId) {
            qb.andWhere('t.empresaId = :empId', { empId: filters.companyId });
        }

        // Tag filter logic involves subquery or join, somewhat complex for 1:N
        if (filters.tagId) {
            qb.innerJoin('t.ticketEtiquetas', 'te_filter', 'te_filter.etiquetaId = :tagId AND te_filter.estado = 1', { tagId: filters.tagId });
        }
    }

    private async processResult(qb: SelectQueryBuilder<Ticket>, filters: TicketFilterDto): Promise<TicketListResponseDto> {
        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const skip = (page - 1) * limit;

        const [tickets, total] = await qb
            .orderBy('t.id', 'DESC')
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        // Map to DTO
        // Warning: TypeORM transformation for `usuarioAsignadoIds` runs after query.
        // We also need to fetch tags for each ticket efficiently.
        // Or we can rely on `eager` or manual fetch. Given pagination, manual fetch/join is fine.

        const ticketIds = tickets.map(t => t.id);

        // 1. Fetch Tags
        let tagsMap: Record<number, TicketTagDto[]> = {};
        if (ticketIds.length > 0) {
            const tags = await this.ticketEtiquetaRepository.createQueryBuilder('te')
                .innerJoinAndSelect('te.etiqueta', 'e')
                .where('te.ticketId IN (:...ids)', { ids: ticketIds })
                .andWhere('te.estado = 1')
                .andWhere('e.estado = 1')
                .getMany();

            tags.forEach(te => {
                if (!tagsMap[te.ticketId]) tagsMap[te.ticketId] = [];
                if (te.etiqueta) {
                    tagsMap[te.ticketId].push({ nombre: te.etiqueta.nombre, color: te.etiqueta.color });
                }
            });
        }

        // 2. Fetch Assignee Names
        // Collect all assignee IDs across all tickets
        const allAssigneeIds = [...new Set(tickets.flatMap(t => t.usuarioAsignadoIds || []))].filter(id => id);
        let assigneeNamesMap = new Map<number, string>();

        if (allAssigneeIds.length > 0) {
            const assignees = await this.userRepository.find({
                where: { id: In(allAssigneeIds) },
                select: ['id', 'nombre', 'apellido']
            });
            assignees.forEach(u => assigneeNamesMap.set(u.id, `${u.nombre} ${u.apellido}`));
        }

        const data: TicketListItemDto[] = tickets.map(t => {
            // Resolver nombre del primer asignado (MVP: usualmente 1, si hay multiples se muestra el primero o 'Múltiples')
            // Legacy solía mostrar el nombre del asignado principal.
            let asignadoNombre = 'Sin Asignar';
            if (t.usuarioAsignadoIds && t.usuarioAsignadoIds.length > 0) {
                const firstId = t.usuarioAsignadoIds[0];
                const name = assigneeNamesMap.get(firstId);
                if (name) {
                    asignadoNombre = t.usuarioAsignadoIds.length > 1 ? `${name} (+${t.usuarioAsignadoIds.length - 1})` : name;
                } else {
                    asignadoNombre = 'Usuario Eliminado';
                }
            }

            return {
                id: t.id,
                titulo: t.titulo,
                estado: t.ticketEstado || 'Abierto', // Default
                fechaCreacion: t.fechaCreacion || new Date(),
                categoria: t.categoria?.nombre || 'N/A',
                subcategoria: t.subcategoria?.nombre || 'N/A',
                prioridadUsuario: 'Media', // Placeholder
                prioridadDefecto: 'Media', // Placeholder
                creadorNombre: t.usuario ? `${t.usuario.nombre} ${t.usuario.apellido}` : 'Unknown',
                asignadoNombre: asignadoNombre,
                etiquetas: tagsMap[t.id] || [],
                // TODO: Add logic for 'prioridad' text based on entity if needed
            };
        });

        return {
            data,
            total,
            page,
            limit
        };
    }

    /**
     * Lists tickets based on the provided filters and user permissions.
     * 
     * Applies security scopes to ensure users only see what they are allowed to see.
     * - Admins/Managers: Can see 'all'.
     * - Agents: Can see 'assigned'.
     * - Users: Can see 'created'.
     * 
     * Supports specific views for Error Tracking:
     * - `ERRORS_REPORTED`: Tickets where the user reported an error.
     * - `ERRORS_RECEIVED`: Tickets where the error is assigned to the user.
     * 
     * @param user The authenticated user payload.
     * @param filters The filter DTO containing view mode, search, dates, etc.
     * @param ability The CASL ability for fine-grained permission checks.
     * @returns A paginated list of tickets with resolved assignee names and tags.
     */
    async list(
        user: any, // JwtPayload
        filters: TicketFilterDto,
        ability: import('../../auth/abilities/ability.factory').AppAbility
    ): Promise<TicketListResponseDto> {
        const qb = this.getBaseQuery();
        let view = filters.view;

        // 1. Security & Fallback Logic
        // Si no se especifica vista, determinamos la mejor vista según permisos
        if (!view || view === TicketView.ALL) {
            // Determinar vista por permisos específicos
            if (ability.can('view:all', 'Ticket')) {
                view = TicketView.ALL;
            } else if (ability.can('view:assigned', 'Ticket')) {
                view = TicketView.ASSIGNED;
            } else if (ability.can('view:created', 'Ticket')) {
                view = TicketView.CREATED;
            } else {
                // Fallback: si tiene permiso read, al menos ve sus creados
                view = TicketView.CREATED;
            }
        }

        // 2. Validar que el usuario tenga permiso para la vista solicitada
        const { ForbiddenException } = await import('@nestjs/common');

        switch (view) {
            case TicketView.ALL:
                if (!ability.can('view:all', 'Ticket')) {
                    throw new ForbiddenException('No tienes permiso para ver todos los tickets');
                }
                break;
            case TicketView.ASSIGNED:
                if (!ability.can('view:assigned', 'Ticket')) {
                    throw new ForbiddenException('No tienes permiso para ver tickets asignados');
                }
                break;
            case TicketView.CREATED:
                if (!ability.can('view:created', 'Ticket')) {
                    throw new ForbiddenException('No tienes permiso para ver tus tickets');
                }
                break;
            case TicketView.OBSERVED:
                if (!ability.can('view:observed', 'Ticket')) {
                    throw new ForbiddenException('No tienes permiso para ver tickets observados');
                }
                break;
        }

        // 3. Aplicar Scope según la Vista Resuelta
        switch (view) {
            case TicketView.CREATED:
                qb.andWhere('t.usuarioId = :userId', { userId: user.usu_id });
                break;
            case TicketView.ASSIGNED:
                qb.andWhere(`FIND_IN_SET(:agentId, t.usu_asig) > 0`, { agentId: user.usu_id });
                break;
            case TicketView.OBSERVED:
                qb.innerJoin('tm_ticket_observador', 'obs', 'obs.tick_id = t.tick_id');
                qb.andWhere('obs.usu_id = :userId', { userId: user.usu_id });
                qb.andWhere('obs.est = 1');
                break;
            case TicketView.ERRORS_REPORTED:
                // Join con tm_ticket_error donde usu_id_reporta = user
                qb.innerJoin('t.ticketErrors', 'te_rep', 'te_rep.usuarioReportaId = :userId', { userId: user.usu_id });
                qb.andWhere('te_rep.estado = 1');
                break;
            case TicketView.ERRORS_RECEIVED:
                // Join con tm_ticket_error donde usu_id_responsable = user
                qb.innerJoin('t.ticketErrors', 'te_resp', 'te_resp.usuarioResponsableId = :userId', { userId: user.usu_id });
                qb.andWhere('te_resp.estado = 1');
                break;
            case TicketView.ALL:
                // No extra filter needed - already validated permission above
                break;
        }

        // 3. Filtros Standard
        this.applyFilters(qb, filters);

        return this.processResult(qb, filters);
    }
}
