import { Ticket } from 'src/modules/tickets/entities/ticket.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tm_notificacion')
export class Notificacion {
    @PrimaryGeneratedColumn({ name: 'not_id' })
    id: number;

    @Column({ name: 'usu_id', type: 'int', nullable: true })
    usuarioId: number | null;

    @Column({ name: 'not_mensaje', type: 'text', nullable: true })
    mensaje: string | null;

    @Column({ name: 'tick_id', type: 'int', nullable: true })
    ticketId: number | null;

    @Column({ name: 'fech_not', type: 'datetime', nullable: true })
    fechaNotificacion: Date | null;

    @Column({ name: 'est', type: 'int', nullable: true })
    estado: number | null;

    @ManyToOne(() => User, (u) => u.notificacion)
    @JoinColumn({ name: 'usu_id' })
    usuario: User;

    @ManyToOne(() => Ticket, (t) => t.notificacion)
    @JoinColumn({ name: 'tick_id' })
    ticket: Ticket;
}
