import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../../../tickets/entities/ticket.entity';
import { TicketAsignacionHistorico } from '../../../tickets/entities/ticket-asignacion-historico.entity';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(Ticket)
        private ticketRepo: Repository<Ticket>,
        @InjectRepository(TicketAsignacionHistorico)
        private ticketAsigRepo: Repository<TicketAsignacionHistorico>,
    ) { }

    async getDashboardStats(userId: number) {
        // 1. Asignaciones Reales (ThTicketAsignacion) -> usu_asig is number here
        const assignedReal = await this.ticketAsigRepo.count({
            where: { usuarioAsignadoId: userId, estado: 1 },
        });

        // 2. Movidos (Asignados por mi a otro)
        const moved = await this.ticketAsigRepo
            .createQueryBuilder('ha')
            .where('ha.usuarioAsignadorId = :userId', { userId })
            .andWhere('ha.usuarioAsignadoId != :userId', { userId })
            .andWhere('ha.estado = 1')
            .getCount();

        // 3. Cerrados (En mi poder y cerrados) -> usu_asig is string "1,2,3" in Ticket
        const closed = await this.ticketRepo
            .createQueryBuilder('t')
            .where("t.ticketEstado = 'Cerrado'")
            .andWhere("FIND_IN_SET(:userIdStr, t.usu_asig) > 0", { userIdStr: userId })
            .andWhere('t.estado = 1') // Ticket activo en sistema? Or check logic. Usually 'est=1' means not deleted.
            .getCount();

        // 4. Abiertos (Stock actual - Pendientes)
        const pending = await this.ticketRepo
            .createQueryBuilder('t')
            .where("t.ticketEstado != 'Cerrado'")
            .andWhere("FIND_IN_SET(:userIdStr, t.usu_asig) > 0", { userIdStr: userId })
            .andWhere('t.estado = 1')
            .getCount();

        // KPI Logic replication
        // Asignados = Max(Real, (Moved + Closed + Pending))
        const impliedTotal = moved + closed + pending;
        const assignedTotal = Math.max(assignedReal, impliedTotal);

        const managedTotal = moved + closed;

        // 5. Recent Tickets
        const recentTickets = await this.ticketAsigRepo.find({
            where: { usuarioAsignadoId: userId },
            order: { fechaAsignacion: 'DESC' },
            take: 5,
            relations: ['ticket', 'paso', 'usuarioAsignador', 'ticket.prioridad', 'ticket.usuario'],
        });

        return {
            assigned: assignedTotal,
            managed: managedTotal,
            pending: pending,
            total: assignedTotal, // User requested "total", typically same as assigned in this context or total distinct tickets
            recent: recentTickets.map((t) => ({
                id: t.ticket.id,
                title: t.ticket.titulo,
                step: t.paso?.nombre || 'N/A',
                status: t.ticket.ticketEstado || 'Abierto',
                priority: t.ticket.prioridad?.nombre || 'Media',
                customer: t.ticket.usuario ? `${t.ticket.usuario.nombre} ${t.ticket.usuario.apellido}` : 'Sistema',
                date: t.fechaAsignacion,
                assignedBy: t.usuarioAsignador
                    ? `${t.usuarioAsignador.nombre} ${t.usuarioAsignador.apellido}`
                    : 'Sistema',
            })),
        };
    }
}
