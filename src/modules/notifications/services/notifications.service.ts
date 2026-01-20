import { Injectable, Logger } from '@nestjs/common';
import { InAppNotificationsService } from './in-app-notifications.service';
import { EmailService } from './email.service';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        private readonly inAppService: InAppNotificationsService,
        private readonly emailService: EmailService,
    ) { }

    /**
     * Notify a user that a ticket has been assigned to them.
     */
    async notifyAssignment(ticket: Ticket, assignee: User) {
        // 1. In-App
        const message = `Se te ha asignado el ticket #${ticket.id}: ${ticket.titulo}`;
        await this.inAppService.create(assignee.id, ticket.id, message);

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
     * Notify that a ticket has been created (usually to the creator confirming, or to supervisors).
     * Currently just confirms to creator.
     */
    async notifyCreation(ticket: Ticket, creator: User) {
        // 1. In-App
        const message = `Ticket #${ticket.id} creado exitosamente.`;
        await this.inAppService.create(creator.id, ticket.id, message);

        // Email optional for creation confirmation to reduce spam, or can implement later.
    }
}
