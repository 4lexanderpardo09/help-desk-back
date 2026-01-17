import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Ticket } from './ticket.entity';
import { User } from '../../users/entities/user.entity';

@Entity('td_ticketdetalle')
export class TicketDetalle {
    @PrimaryGeneratedColumn({ name: 'tickd_id' })
    id: number;

    @Column({ name: 'tick_id', type: 'int' })
    ticketId: number;

    @Column({ name: 'usu_id', type: 'int' })
    usuarioId: number;

    @Column({ name: 'tickd_descrip', type: 'mediumtext' })
    descripcion: string;

    @Column({ name: 'fech_crea', type: 'datetime' })
    fechaCreacion: Date;

    @Column({ name: 'est', type: 'int' })
    estado: number;

    @ManyToOne(() => Ticket, (t) => t.detalles)
    @JoinColumn({ name: 'tick_id' })
    ticket: Ticket;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'usu_id' })
    usuario: User;
}
