import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacion } from '../entities/notificacion.entity';

@Injectable()
export class InAppNotificationsService {
    constructor(
        @InjectRepository(Notificacion)
        private readonly notifRepo: Repository<Notificacion>,
    ) { }

    /**
     * Creates a new in-app notification.
     * @param userId - Recipient user ID
     * @param ticketId - Related ticket ID
     * @param message - Notification content
     */
    async create(userId: number, ticketId: number, message: string): Promise<Notificacion> {
        const notif = this.notifRepo.create({
            usuarioId: userId,
            ticketId: ticketId,
            mensaje: message,
            fechaNotificacion: new Date(),
            estado: 2 // 2 = New (Not yet pushed via WS), though we might just use 1 (Unread) directly if WS isn't ready
        });
        return this.notifRepo.save(notif);
    }

    async getUnreadByUser(userId: number): Promise<Notificacion[]> {
        return this.notifRepo.find({
            where: {
                usuarioId: userId,
                estado: 2 // Or based on logic (2 and 1 are unread?)
            },
            order: { fechaNotificacion: 'DESC' }
        });
    }

    async markAsRead(id: number): Promise<void> {
        await this.notifRepo.update(id, { estado: 0 });
    }
}
