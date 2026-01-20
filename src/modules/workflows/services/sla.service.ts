import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { TicketAsignacionHistorico } from '../../tickets/entities/ticket-asignacion-historico.entity';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class SlaService {
    private readonly logger = new Logger(SlaService.name);

    constructor(
        @InjectRepository(Ticket)
        private readonly ticketRepo: Repository<Ticket>,
        @InjectRepository(TicketAsignacionHistorico)
        private readonly historyRepo: Repository<TicketAsignacionHistorico>,
        private readonly notificationsService: NotificationsService,
    ) { }

    /**
     * Calculates if a step is on time or late based on start time and SLA hours.
     */
    calculateSlaStatus(startDate: Date, slaHours: number): 'A Tiempo' | 'Atrasado' {
        if (!startDate || slaHours === null || slaHours === undefined) return 'A Tiempo';

        const now = new Date();
        const elapsedMillis = now.getTime() - startDate.getTime();
        const slaMillis = slaHours * 60 * 60 * 1000;

        return elapsedMillis > slaMillis ? 'Atrasado' : 'A Tiempo';
    }

    /**
     * Finds tickets that have exceeded their current step's SLA.
     */
    async findOverdueTickets(): Promise<Ticket[]> {
        // Find tickets that are active (est=1) and not closed
        const tickets = await this.ticketRepo.find({
            where: {
                estado: 1, // Active tickets
            },
            relations: ['pasoActual', 'historiales'],
        });

        const overdueTickets: Ticket[] = [];

        for (const ticket of tickets) {
            if (!ticket.pasoActual || !ticket.pasoActual.horasSla) continue;

            // Get the last assignment date (current step start date)
            const lastAssignment = await this.historyRepo.findOne({
                where: { ticketId: ticket.id, pasoId: ticket.pasoActualId as number },
                order: { fechaAsignacion: 'DESC' }
            });

            if (!lastAssignment) continue;

            const status = this.calculateSlaStatus(lastAssignment.fechaAsignacion, ticket.pasoActual.horasSla);

            if (status === 'Atrasado' && lastAssignment.slaStatus !== 'Atrasado') {
                overdueTickets.push(ticket);
            }
        }

        return overdueTickets;
    }

    /**
     * Processes an overdue ticket: updates status and escalates if configured.
     */
    async processOverdueTicket(ticket: Ticket) {
        this.logger.log(`Processing overdue ticket #${ticket.id} at step ${ticket.pasoActual.nombre}`);

        // 1. Mark current assignment as 'Atrasado'
        const lastAssignment = await this.historyRepo.findOne({
            where: { ticketId: ticket.id, pasoId: ticket.pasoActualId as number },
            order: { fechaAsignacion: 'DESC' }
        });

        if (lastAssignment) {
            lastAssignment.slaStatus = 'Atrasado';
            lastAssignment.estadoTiempoPaso = 'Vencido';
            await this.historyRepo.save(lastAssignment);
        }

        // 2. Notification Logic (User Alert Only)
        // Notify current assignees about the delay - NO MORE ESCALATION
        if (ticket.usuarioAsignadoIds && ticket.usuarioAsignadoIds.length > 0) {
            for (const userId of ticket.usuarioAsignadoIds) {
                // Determine if user has connected socket or email
                // We use emitToUser for real-time alert
                this.notificationsService.getGateway().emitToUser(userId, 'ticket_overdue', {
                    mensaje: `ALERTA: El ticket #${ticket.id} "${ticket.titulo}" ha vencido su tiempo límite (SLA).`,
                    ticketId: ticket.id,
                    fecha: new Date(),
                });
            }
            this.logger.log(`Notified users [${ticket.usuarioAsignadoIds.join(', ')}] about overdue ticket #${ticket.id}`);
        }
    }
}
