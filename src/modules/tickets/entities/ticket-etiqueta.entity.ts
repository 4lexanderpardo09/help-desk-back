import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('td_ticket_etiqueta')
export class TicketEtiqueta {
    @PrimaryGeneratedColumn({ name: 'tick_eti_id' })
    id: number;

    @Column({ name: 'tick_id', type: 'int' })
    ticketId: number;

    @Column({ name: 'eti_id', type: 'int' })
    etiquetaId: number;

    @Column({ name: 'usu_id', type: 'int', comment: 'ID del usuario que asignó' })
    usuarioId: number;

    @Column({ name: 'fech_crea', type: 'datetime', nullable: true })
    fechaCreacion: Date | null;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;

    // TODO: Agregar relaciones ManyToOne
    // @ManyToOne(() => Ticket)
    // @JoinColumn({ name: 'tick_id' })
    // ticket: Ticket;

    // @ManyToOne(() => Etiqueta)
    // @JoinColumn({ name: 'eti_id' })
    // etiqueta: Etiqueta;

    // @ManyToOne(() => User)
    // @JoinColumn({ name: 'usu_id' })
    // asignadoPor: User;
}
