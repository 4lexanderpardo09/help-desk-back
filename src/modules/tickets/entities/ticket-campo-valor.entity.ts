import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('td_ticket_campo_valor')
export class TicketCampoValor {
    @PrimaryGeneratedColumn({ name: 'tick_campo_id' })
    id: number;

    @Column({ name: 'tick_id', type: 'int' })
    ticketId: number;

    @Column({ name: 'campo_id', type: 'int' })
    campoId: number;

    @Column({ name: 'valor', type: 'text', nullable: true })
    valor: string | null;

    @Column({ name: 'fech_crea', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    fechaCreacion: Date;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;

    // TODO: Agregar relaciones ManyToOne
    // @ManyToOne(() => Ticket)
    // @JoinColumn({ name: 'tick_id' })
    // ticket: Ticket;

    // @ManyToOne(() => Campo)
    // @JoinColumn({ name: 'campo_id' })
    // campo: Campo;
}
