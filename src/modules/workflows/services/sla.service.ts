import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { TicketAsignacionHistorico } from '../../tickets/entities/ticket-asignacion-historico.entity';
import { NotificationsService } from '../../notifications/services/notifications.service';

/**
 * SLA Service for tracking step time limits.
 * 
 * DISABLED: This service requires database schema updates.
 * Columns needed in `tm_flujo_paso`:
 *   - paso_horas_sla DECIMAL(10,2)
 *   - usuario_escalado_id INT
 * Column needed in `th_ticket_asignacion`:
 *   - sla_status VARCHAR(20)
 * 
 * Once these columns are added, re-enable the logic below.
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
     * Calculates if a step is on time or late based on start time and SLA hours.
     * @disabled Database columns missing
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
     * @disabled Database columns missing (paso_horas_sla)
     */
    async findOverdueTickets(): Promise<Ticket[]> {
        // DISABLED: horasSla column does not exist in tm_flujo_paso
        this.logger.warn('SLA Check DISABLED: Missing DB columns (paso_horas_sla, sla_status)');
        return [];
    }

    /**
     * Processes an overdue ticket: updates status and notifies assignees.
     * @disabled Database columns missing
     */
    async processOverdueTicket(ticket: Ticket) {
        // DISABLED: slaStatus column does not exist in th_ticket_asignacion
        this.logger.warn(`processOverdueTicket DISABLED for ticket #${ticket.id}`);
    }
}
