import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Ticket } from './ticket.entity';
import { User } from '../../users/entities/user.entity';
import { PasoFlujo } from '../../workflows/entities/paso-flujo.entity';
import { ErrorType } from '../../error-types/entities/error-type.entity';

@Entity('th_ticket_asignacion')
export class TicketAsignacionHistorico {
    @PrimaryGeneratedColumn({ name: 'th_id' })
    id: number;

    @Column({ name: 'tick_id', type: 'int' })
    ticketId: number;

    @Column({ name: 'usu_asig', type: 'int', comment: 'El nuevo usuario asignado' })
    usuarioAsignadoId: number;

    @Column({ name: 'how_asig', type: 'int', nullable: true, comment: 'El usuario que realiza la asignación' })
    usuarioAsignadorId: number | null;

    @Column({ name: 'error_code_id', type: 'int', nullable: true })
    errorCodeId: number | null;

    @Column({ name: 'error_descrip', type: 'text', nullable: true })
    errorDescripcion: string | null;

    @Column({ name: 'paso_id', type: 'int', nullable: true })
    pasoId: number | null;

    @Column({ name: 'fech_asig', type: 'datetime' })
    fechaAsignacion: Date;

    @Column({ name: 'asig_comentario', type: 'text', nullable: true, comment: 'Comentario opcional sobre la reasignación' })
    comentario: string | null;

    @Column({ name: 'estado_tiempo_paso', type: 'varchar', length: 20, nullable: true })
    estadoTiempoPaso: string | null;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;

    @ManyToOne(() => Ticket, (t) => t.historiales)
    @JoinColumn({ name: 'tick_id' })
    ticket: Ticket;

    @ManyToOne(() => User, (u) => u.historialesAsignados)
    @JoinColumn({ name: 'usu_asig' })
    usuarioAsignado: User;

    @ManyToOne(() => User, (u) => u.historialesAsignador)
    @JoinColumn({ name: 'how_asig' })
    usuarioAsignador: User;

    @ManyToOne(() => PasoFlujo, (p) => p.historiales)
    @JoinColumn({ name: 'paso_id' })
    paso: PasoFlujo;

    @ManyToOne(() => ErrorType, (et) => et.historiales)
    @JoinColumn({ name: 'error_code_id' })
    errorCode: ErrorType;
}
