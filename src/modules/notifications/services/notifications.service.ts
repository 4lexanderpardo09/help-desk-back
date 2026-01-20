import { Injectable, Logger } from '@nestjs/common';
import { InAppNotificationsService } from './in-app-notifications.service';
import { EmailService } from './email.service';
import { NotificationsGateway } from '../notifications.gateway';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        private readonly inAppService: InAppNotificationsService,
        private readonly emailService: EmailService,
        private readonly gateway: NotificationsGateway,
    ) { }

    /**
     * Notify a user that a ticket has been assigned to them.
     * Triggers:
     * 1. In-App Notification (DB)
     * 2. WebSocket Event ('new_notification')
     * 3. Email Notification (if email is valid)
     * 
     * @param ticket - The ticket object
     * @param assignee - The user assigned to the ticket
     */
    async notifyAssignment(ticket: Ticket, assignee: User) {
        // 1. In-App
        const message = `Se te ha asignado el ticket #${ticket.id}: ${ticket.titulo}`;
        await this.inAppService.create(assignee.id, ticket.id, message);

        // 1.1 WebSocket
        this.gateway.emitToUser(assignee.id, 'new_notification', {
            mensaje: message,
            ticketId: ticket.id,
            fecha: new Date(),
        });

        // 2. Email
        if (assignee.email && assignee.email.includes('@')) {
            await this.emailService.sendAssignmentNotification(assignee.email, {
                id: ticket.id,
                title: ticket.titulo,
                assignedToName: `${assignee.nombre} ${assignee.apellido || ''}`
            });
        } else {
            this.logger.warn(`User ${assignee.id} has no valid email. Skipping email notification.`);
        }
    }

    /**
     * Notify that a ticket has been created.
     * Used to confirm creation to the creator or notify supervisors.
     * Triggers:
     * 1. In-App Notification (DB)
     * 2. WebSocket Event ('new_notification')
     * 
     * @param ticket - The created ticket
     * @param creator - The user who created the ticket
     */
    async notifyCreation(ticket: Ticket, creator: User) {
        // 1. In-App
        const message = `Ticket #${ticket.id} creado exitosamente.`;
        await this.inAppService.create(creator.id, ticket.id, message);

        // 1.1 WebSocket
        this.gateway.emitToUser(creator.id, 'new_notification', {
            mensaje: message,
            ticketId: ticket.id,
            fecha: new Date(),
        });

        // Email optional for creation confirmation to reduce spam, or can implement later.
    }
}
