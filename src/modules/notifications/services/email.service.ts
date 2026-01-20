import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);

    constructor(private readonly mailerService: MailerService) { }

    async sendAssignmentNotification(to: string, ticketInfos: { id: number; title: string; assignedToName: string }) {
        try {
            await this.mailerService.sendMail({
                to,
                subject: `[Mesa de Ayuda] Ticket Asignado #${ticketInfos.id}`,
                html: `
                    <h3>Has sido asignado responsable del ticket #${ticketInfos.id}</h3>
                    <p><strong>Título:</strong> ${ticketInfos.title}</p>
                    <p>Por favor ingresa a la plataforma para gestionarlo.</p>
                `,
            });
            this.logger.log(`Email sent to ${to} for Ticket ${ticketInfos.id}`);
        } catch (error) {
            this.logger.error(`Failed to send email to ${to}`, error.stack);
        }
    }

    async sendStatusChangeNotification(to: string, ticketInfos: { id: number; title: string; status: string }) {
        try {
            await this.mailerService.sendMail({
                to,
                subject: `[Mesa de Ayuda] Actualización Ticket #${ticketInfos.id}`,
                html: `
                    <h3>El ticket #${ticketInfos.id} ha cambiado de estado</h3>
                    <p><strong>Título:</strong> ${ticketInfos.title}</p>
                    <p><strong>Nuevo Estado:</strong> ${ticketInfos.status}</p>
                `,
            });
        } catch (error) {
            this.logger.error(`Failed to send email to ${to}`, error.stack);
        }
    }
}
