import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Ticket } from '../../tickets/entities/ticket.entity';

@Entity('td_documento_cierre')
export class DocumentoCierre {
    @PrimaryGeneratedColumn({ name: 'doc_cierre_id' })
    id: number;

    @Column({ name: 'tick_id', type: 'int' })
    ticketId: number;

    @Column({ name: 'doc_nom', type: 'varchar', length: 255 })
    nombre: string;

    @Column({ name: 'fech_crea', type: 'datetime' })
    fechaCreacion: Date;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;

    @ManyToOne(() => Ticket, (t) => t.documentosCierre)
    @JoinColumn({ name: 'tick_id' })
    ticket: Ticket;
}
