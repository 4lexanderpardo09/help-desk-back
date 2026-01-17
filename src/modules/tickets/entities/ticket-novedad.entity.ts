import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Ticket } from './ticket.entity';
import { PasoFlujo } from '../../workflows/entities/paso-flujo.entity';
import { User } from '../../users/entities/user.entity';

@Entity('th_ticket_novedad')
export class TicketNovedad {
    @PrimaryGeneratedColumn({ name: 'novedad_id' })
    id: number;

    @Column({ name: 'tick_id', type: 'int' })
    ticketId: number;

    @Column({ name: 'paso_id_pausado', type: 'int' })
    pasoPausadoId: number;

    @Column({ name: 'usu_asig_novedad', type: 'int' })
    usuarioAsignadoNovedadId: number;

    @Column({ name: 'usu_crea_novedad', type: 'int' })
    usuarioCreadorNovedadId: number;

    @Column({ name: 'descripcion_novedad', type: 'text' })
    descripcion: string;

    @Column({ name: 'fecha_inicio', type: 'datetime' })
    fechaInicio: Date;

    @Column({ name: 'fecha_fin', type: 'datetime', nullable: true })
    fechaFin: Date | null;

    @Column({ name: 'estado_novedad', type: 'enum', enum: ['Abierta', 'Resuelta'], default: 'Abierta' })
    estado: 'Abierta' | 'Resuelta';

    @ManyToOne(() => Ticket, (t) => t.ticketNovedades)
    @JoinColumn({ name: 'tick_id' })
    ticket: Ticket;

    @ManyToOne(() => PasoFlujo, (p) => p.ticketNovedades)
    @JoinColumn({ name: 'paso_id_pausado' })
    pasoPausado: PasoFlujo;

    @ManyToOne(() => User, (u) => u.ticketNovedadesAsignadas)
    @JoinColumn({ name: 'usu_asig_novedad' })
    usuarioAsignado: User;

    @ManyToOne(() => User, (u) => u.ticketNovedadesCreadas)
    @JoinColumn({ name: 'usu_crea_novedad' })
    usuarioCreador: User;
}
