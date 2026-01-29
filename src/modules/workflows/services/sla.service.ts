import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { TicketAsignacionHistorico } from '../../tickets/entities/ticket-asignacion-historico.entity';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { DateHelper } from '../../../common/utils/date.helper';

/**
 * SLA Service for tracking step time limits.
 * Uses `paso_tiempo_habil` (Days) from DB.
 */
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
     * Calculates if a step is on time or late based on start time and SLA days.
     * Uses true business day logic (excluding weekends and holidays).
     * 
     * @param startDate Date the ticket entered the step.
     * @param slaDays SLA in business days.
     */
    calculateSlaStatus(startDate: Date, slaDays: number): 'A Tiempo' | 'Atrasado' {
        if (!startDate || slaDays === null || slaDays === undefined) return 'A Tiempo';

        const now = new Date();
        const deadline = DateHelper.addBusinessDays(startDate, slaDays);

        return now > deadline ? 'Atrasado' : 'A Tiempo';
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
            // Check if step exists and has SLA Config (tiempoHabil)
            if (!ticket.pasoActual || !ticket.pasoActual.tiempoHabil) continue;

            // Get the last assignment date (current step start date)
            const lastAssignment = await this.historyRepo.findOne({
                where: { ticketId: ticket.id, pasoId: ticket.pasoActualId as number },
                order: { fechaAsignacion: 'DESC' }
            });

            if (!lastAssignment) continue;

            // Check if already marked as overdue to avoid re-processing
            if (lastAssignment.estadoTiempoPaso === 'Vencido') continue;

            const status = this.calculateSlaStatus(lastAssignment.fechaAsignacion, ticket.pasoActual.tiempoHabil);

            if (status === 'Atrasado') {
                overdueTickets.push(ticket);
            }
        }

        return overdueTickets;
    }

    /**
     * Processes an overdue ticket: updates status and notifies assignees.
     */
    async processOverdueTicket(ticket: Ticket) {
        this.logger.log(`Processing overdue ticket #${ticket.id} at step ${ticket.pasoActual.nombre}`);

        // 1. Mark current assignment as 'Vencido'
        const lastAssignment = await this.historyRepo.findOne({
            where: { ticketId: ticket.id, pasoId: ticket.pasoActualId as number },
            order: { fechaAsignacion: 'DESC' }
        });

        if (lastAssignment) {
            // Update the existing column `estadoTiempoPaso`
            lastAssignment.estadoTiempoPaso = 'Vencido';
            await this.historyRepo.save(lastAssignment);
        }

        // 2. Notification Logic (User Alert Only)
        // Notify current assignees about the delay
        if (ticket.usuarioAsignadoIds && ticket.usuarioAsignadoIds.length > 0) {
            for (const userId of ticket.usuarioAsignadoIds) {
                this.notificationsService.getGateway().emitToUser(userId, 'ticket_overdue', {
                    mensaje: `ALERTA: El ticket #${ticket.id} "${ticket.titulo}" ha vencido su tiempo límite (${ticket.pasoActual.tiempoHabil} días).`,
                    ticketId: ticket.id,
                    fecha: new Date(),
                });
            }
            this.logger.log(`Notified users [${ticket.usuarioAsignadoIds.join(', ')}] about overdue ticket #${ticket.id}`);
        }
    }
}
