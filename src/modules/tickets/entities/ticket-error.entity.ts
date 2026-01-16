import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tm_ticket_error')
export class TicketError {
    @PrimaryGeneratedColumn({ name: 'error_id' })
    id: number;

    @Column({ name: 'tick_id', type: 'int' })
    ticketId: number;

    @Column({ name: 'usu_id_reporta', type: 'int' })
    usuarioReportaId: number;

    @Column({ name: 'usu_id_responsable', type: 'int' })
    usuarioResponsableId: number;

    @Column({ name: 'answer_id', type: 'int' })
    answerId: number;

    @Column({ name: 'error_descrip', type: 'text', nullable: true })
    descripcion: string | null;

    @Column({ name: 'es_error_proceso', type: 'tinyint', default: 0, nullable: true })
    esErrorProceso: boolean | null;

    @Column({ name: 'fech_crea', type: 'datetime', default: () => 'CURRENT_TIMESTAMP', nullable: true })
    fechaCreacion: Date | null;

    @Column({ name: 'est', type: 'int', default: 1, nullable: true })
    estado: number | null;

    // TODO: Agregar relaciones
    // @ManyToOne(() => Ticket)
    // @JoinColumn({ name: 'tick_id' })
    // ticket: Ticket;

    // @ManyToOne(() => User)
    // @JoinColumn({ name: 'usu_id_reporta' })
    // usuarioReporta: User;

    // @ManyToOne(() => User)
    // @JoinColumn({ name: 'usu_id_responsable' })
    // usuarioResponsable: User;

    // @ManyToOne(() => FastAnswer)
    // @JoinColumn({ name: 'answer_id' })
    // answer: FastAnswer;
}
