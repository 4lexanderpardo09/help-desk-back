import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, SelectQueryBuilder } from 'typeorm';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { TicketAsignacionHistorico } from '../../tickets/entities/ticket-asignacion-historico.entity';
import { User } from '../../users/entities/user.entity';
import { DashboardFiltersDto } from '../dto/dashboard-filters.dto';
import { DashboardStatsDto, DatasetItemDto } from '../dto/dashboard-stats.dto';
import { StepMetricDto } from '../dto/step-metric.dto';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

@Injectable()
export class TicketStatisticsService {
    constructor(
        @InjectRepository(Ticket)
        private readonly ticketRepository: Repository<Ticket>,
        @InjectRepository(TicketAsignacionHistorico)
        private readonly historyRepository: Repository<TicketAsignacionHistorico>,
    ) { }

    /**
     * Determine Scope: Which User IDs can this user see?
     * 
     * - Admin/Manager (Rol 1, 4): All (returns 'all')
     * - Agent (Rol 2): Tickets assigned to them
     * - Client (Rol 3): Tickets created by them
     * 
     * TODO: Implement hierarchical "Boss" scope (see Rule 2.1 in Kpi.analysis)
     */
    async getScope(user: JwtPayload): Promise<number[] | 'all'> {
        const roleId = user.rol_id;

        // Admin hardcoded for now until we have dynamic permissions field for "view_scope"
        if (roleId === 1 || roleId === 4) {
            return 'all';
        }

        // Logic for Agent/Client is handled via WHERE clauses in the query builder
        // related to "created_by" or "assigned_to", not just a list of IDs.
        // But for "Users I can see stats for", it's usually just themselves.
        return [user.usu_id];
    }

    /**
     * Get Main Dashboard Statistics
     */
    async getDashboardStats(user: JwtPayload, filters: DashboardFiltersDto): Promise<DashboardStatsDto> {
        const qb = this.ticketRepository.createQueryBuilder('t');

        // 1. Apply Scope
        await this.applyScope(qb, user);

        // 2. Apply Filters
        await this.applyFilters(qb, filters);

        // 3. Clone query for Open/Closed counts
        const openQuery = qb.clone();
        const closedQuery = qb.clone();

        /*
            Estado Logic:
            - Abierto: ticketEstado != 'Cerrado' AND est = 1
            - Cerrado: ticketEstado = 'Cerrado' AND est = 1
        */

        const openCount = await openQuery
            .andWhere('t.ticketEstado != :closedState', { closedState: 'Cerrado' })
            .getCount();

        const closedCount = await closedQuery
            .andWhere('t.ticketEstado = :closedState', { closedState: 'Cerrado' })
            .getCount();

        // 4. Grouping for Dataset (Chart Data)
        const dataset = await this.getGroupedStats(qb, filters.groupBy);

        return {
            openCount,
            closedCount,
            totalCount: openCount + closedCount,
            dataset
        };
    }

    private async applyScope(qb: SelectQueryBuilder<Ticket>, user: JwtPayload) {
        // Basic Role-Based Scope
        const roleId = user.rol_id;

        if (roleId === 1 || roleId === 4) {
            // Admin/Supervisor: See all
            return;
        }

        if (roleId === 2) {
            // Agent: See assigned tickets
            // Legacy matches FIND_IN_SET for usu_asig
            qb.andWhere(new Brackets(sub => {
                sub.where(`FIND_IN_SET(:userId, t.usu_asig) > 0`, { userId: user.usu_id })
                    .orWhere('t.usuarioId = :userId', { userId: user.usu_id }); // Or created by them
            }));
        } else {
            // Client: Only created by them
            qb.andWhere('t.usuarioId = :userId', { userId: user.usu_id });
        }
    }

    private async applyFilters(qb: SelectQueryBuilder<Ticket>, filters: DashboardFiltersDto) {
        qb.andWhere('t.estado = 1'); // Only active tickets

        if (filters.dateFrom) {
            qb.andWhere('t.fechaCreacion >= :dateFrom', { dateFrom: `${filters.dateFrom} 00:00:00` });
        }
        if (filters.dateTo) {
            qb.andWhere('t.fechaCreacion <= :dateTo', { dateTo: `${filters.dateTo} 23:59:59` });
        }

        if (filters.departmentId) {
            qb.andWhere('t.departamentoId = :deptId', { deptId: filters.departmentId });
        }

        if (filters.categoryId) {
            qb.andWhere('t.categoriaId = :catId', { catId: filters.categoryId });
        }
    }

    private async getGroupedStats(baseQuery: SelectQueryBuilder<Ticket>, groupBy?: string): Promise<DatasetItemDto[]> {
        const qb = baseQuery.clone();
        let results: any[] = [];

        switch (groupBy) {
            case 'department':
                qb.leftJoin('t.departamento', 'd')
                    .select('d.nombre', 'label')
                    .addSelect('d.id', 'id')
                    .addSelect('COUNT(t.id)', 'value')
                    .groupBy('d.id')
                    .orderBy('value', 'DESC');
                break;
            case 'category':
                qb.leftJoin('t.categoria', 'c')
                    .select('c.nombre', 'label')
                    .addSelect('c.id', 'id')
                    .addSelect('COUNT(t.id)', 'value')
                    .groupBy('c.id')
                    .orderBy('value', 'DESC');
                break;
            case 'user':
                // Group by Creator
                qb.leftJoin('t.usuario', 'u')
                    .select("CONCAT(u.nombre, ' ', u.apellido)", 'label')
                    .addSelect('u.id', 'id')
                    .addSelect('COUNT(t.id)', 'value')
                    .groupBy('u.id')
                    .orderBy('value', 'DESC');
                break;
            default:
                // Default to Category if not specified, or return empty if that makes sense
                // Let's default to Status just to show something if no group
                qb.select('t.ticketEstado', 'label')
                    .addSelect('COUNT(t.id)', 'value')
                    .groupBy('t.ticketEstado');
        }

        results = await qb.getRawMany();

        return results.map(r => ({
            label: r.label || 'S/D', // Sin Datos
            value: Number(r.value),
            id: r.id ? Number(r.id) : undefined
        }));
    }

    /**
     * Calculate Performance Metrics (Response Time per Step)
     */
    async getPerformanceMetrics(ticketId: number): Promise<StepMetricDto[]> {
        const history = await this.historyRepository.find({
            where: { ticketId, estado: 1 },
            order: { id: 'ASC' },
            relations: ['usuario'] // To show who handled it
        });

        const metrics: StepMetricDto[] = [];

        /*
           Logic:
           Each history entry represents a point in time where assignment/status changed.
           The duration of a step is Time(Next) - Time(Current).
           The last step is open until now (if ticket open) or until closed date.
        */

        for (let i = 0; i < history.length; i++) {
            const current = history[i];
            const next = history[i + 1];

            const startDate = current.fechaAsignacion;
            const endDate = next ? next.fechaAsignacion : new Date(); // If last, calc until now

            const diffMs = endDate.getTime() - startDate.getTime();
            const durationMinutes = Math.round(diffMs / 60000);

            metrics.push({
                stepName: `Paso ${i + 1}`, // In legacy this linked to workflow steps, for now just sequential
                durationMinutes,
                startDate,
                endDate: next ? next.fechaAsignacion : null,
                assignedUser: current.usuarioAsignado ? `${current.usuarioAsignado.nombre} ${current.usuarioAsignado.apellido}` : 'Sistema'
            });
        }

        return metrics;
    }
}
