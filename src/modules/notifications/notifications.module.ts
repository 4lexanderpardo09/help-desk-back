import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { Notificacion } from './entities/notificacion.entity';
import { NotificationsService } from './services/notifications.service';
import { InAppNotificationsService } from './services/in-app-notifications.service';
import { EmailService } from './services/email.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Notificacion]),
        MailerModule.forRoot({
            transport: {
                host: process.env.SMTP_HOST || 'smtp.example.com',
                port: Number(process.env.SMTP_PORT) || 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: process.env.SMTP_USER || 'user',
                    pass: process.env.SMTP_PASS || 'pass',
                },
            },
            defaults: {
                from: '"Mesa de Ayuda" <noreply@mesadeayuda.com>',
            },
        }),
    ],
    providers: [
        NotificationsService,
        InAppNotificationsService,
        EmailService
    ],
    exports: [NotificationsService],
})
export class NotificationsModule { }
