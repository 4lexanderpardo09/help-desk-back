import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/*
 * NOTA: Las tablas KPI son principalmente las mismas que el core (tm_ticket, etc).
 * Aquí definimos solo las entidades ESPECÍFICAS de logs/historial que usa el KPI 
 * y que no están en otros módulos (o para asegurar su existencia legacy).
 */

@Entity('th_ticket_asignacion')
export class TicketAsignacionLegacy {
    @PrimaryGeneratedColumn({ name: 'asig_id' })
    id: number;

    @Column({ name: 'tick_id', type: 'int' })
    ticketId: number;

    @Column({ name: 'usu_asig', type: 'int' })
    usuarioAsignadoId: number;

    @Column({ name: 'fech_asig', type: 'datetime' })
    fechaAsignacion: Date;

    @Column({ name: 'usu_id', type: 'int', nullable: true })
    usuarioCreadorId: number | null; // A veces null en legacy logic

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;

    // Legacy fields for KPI tracking
    @Column({ name: 'how_asig', type: 'int', nullable: true })
    quienAsignoId: number | null;
}

@Entity('th_ticket_novedad')
export class TicketNovedadLegacy {
    @PrimaryGeneratedColumn({ name: 'novedad_id' })
    id: number;

    @Column({ name: 'tick_id', type: 'int' })
    ticketId: number;

    @Column({ name: 'usu_asig_novedad', type: 'int' })
    usuarioId: number;

    @Column({ name: 'descripcion_novedad', type: 'text' })
    descripcion: string;

    @Column({ name: 'estado_novedad', type: 'varchar', length: 50 })
    estadoNovedad: string; // 'Resuelta', etc.

    @Column({ name: 'fecha_inicio', type: 'datetime' })
    fechaInicio: Date;

    @Column({ name: 'fecha_fin', type: 'datetime', nullable: true })
    fechaFin: Date | null;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;
}

@Entity('tm_ticket_error')
export class TicketErrorLegacy {
    @PrimaryGeneratedColumn({ name: 'error_id' })
    id: number;

    @Column({ name: 'tick_id', type: 'int' })
    ticketId: number;

    @Column({ name: 'error_descrip', type: 'text' })
    descripcion: string;

    @Column({ name: 'es_error_proceso', type: 'int' })
    esErrorProceso: number;

    @Column({ name: 'usu_id_responsable', type: 'int', nullable: true })
    usuarioResponsableId: number | null;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;
}
