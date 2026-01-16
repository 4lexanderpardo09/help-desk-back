import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tm_ticket_paralelo')
export class TicketParalelo {
    @PrimaryGeneratedColumn({ name: 'paralelo_id' })
    id: number;

    @Column({ name: 'tick_id', type: 'int' })
    ticketId: number;

    @Column({ name: 'paso_id', type: 'int' })
    pasoId: number;

    @Column({ name: 'usu_id', type: 'int' })
    usuarioId: number;

    @Column({ name: 'estado', type: 'varchar', length: 20, default: 'Pendiente', nullable: true })
    estado: string | null;

    @Column({ name: 'estado_tiempo_paso', type: 'varchar', length: 50, nullable: true })
    estadoTiempoPaso: string | null;

    @Column({ name: 'fech_crea', type: 'datetime', default: () => 'CURRENT_TIMESTAMP', nullable: true })
    fechaCreacion: Date | null;

    @Column({ name: 'fech_cierre', type: 'datetime', nullable: true })
    fechaCierre: Date | null;

    @Column({ name: 'comentario', type: 'text', nullable: true })
    comentario: string | null;

    @Column({ name: 'est', type: 'int', default: 1, nullable: true })
    activo: number | null;

    // TODO: Agregar relaciones
    // @ManyToOne(() => Ticket)
    // @JoinColumn({ name: 'tick_id' })
    // ticket: Ticket;

    // @ManyToOne(() => PasoFlujo)
    // @JoinColumn({ name: 'paso_id' })
    // paso: PasoFlujo;

    // @ManyToOne(() => User)
    // @JoinColumn({ name: 'usu_id' })
    // usuario: User;
}
