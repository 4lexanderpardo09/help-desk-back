import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Ticket } from './ticket.entity';
import { User } from '../../users/entities/user.entity';
import { DocumentoDetalle } from '../../documents/entities/documento-detalle.entity';

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

    @ManyToOne(() => User, (u) => u.detallesCreados)
    @JoinColumn({ name: 'usu_id' })
    usuario: User;

    @OneToMany(() => DocumentoDetalle, (dd) => dd.ticketDetalle)
    documentos: DocumentoDetalle[];
}
