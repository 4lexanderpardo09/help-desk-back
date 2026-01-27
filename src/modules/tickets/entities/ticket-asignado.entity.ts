import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Ticket } from './ticket.entity';
import { User } from '../../users/entities/user.entity';

@Entity('ticket_usuarios_asig')
export class TicketAsignado {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'tick_id', type: 'int' })
    ticketId: number;

    @Column({ name: 'usu_id', type: 'int' })
    usuarioId: number;

    @Column({ name: 'tipo', type: 'varchar', length: 50, default: 'Principal' })
    tipo: string; // 'Principal', 'Paralelo', 'Observador'

    @CreateDateColumn({ name: 'fecha_asignacion' })
    fechaAsignacion: Date;

    @ManyToOne(() => Ticket, (ticket) => ticket.asignados)
    @JoinColumn({ name: 'tick_id' })
    ticket: Ticket;

    @ManyToOne(() => User, (user) => user.asignaciones)
    @JoinColumn({ name: 'usu_id' })
    usuario: User;
}
