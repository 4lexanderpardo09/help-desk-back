import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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

    // TODO: Agregar relaciones ManyToOne
    // @ManyToOne(() => User)
    // @JoinColumn({ name: 'usu_id' })
    // usuario: User;

    // @ManyToOne(() => Ticket)
    // @JoinColumn({ name: 'tick_id' })
    // ticket: Ticket;
}
