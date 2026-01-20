import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * Organigrama - Jerarquía de Cargos.
 */
@Entity('tm_organigrama')
export class OrganigramaLegacy {
    @PrimaryGeneratedColumn({ name: 'org_id' })
    id: number;

    /** Cargo subordinado */
    @Column({ name: 'car_id', type: 'int' })
    cargoId: number;

    /** Cargo del jefe inmediato */
    @Column({ name: 'jefe_car_id', type: 'int' })
    jefeCargoId: number;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;
}

/**
 * Etiquetas personalizadas por usuario.
 */
@Entity('tm_etiqueta')
export class EtiquetaLegacy {
    @PrimaryGeneratedColumn({ name: 'eti_id' })
    id: number;

    @Column({ name: 'usu_id', type: 'int' })
    usuarioId: number;

    @Column({ name: 'eti_nom', type: 'varchar', length: 100 })
    nombre: string;

    @Column({ name: 'eti_color', type: 'varchar', length: 20 })
    color: string;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;
}

/**
 * Relación Many-to-Many Ticket-Etiqueta.
 */
@Entity('td_ticket_etiqueta')
export class TicketEtiquetaLegacy {
    @PrimaryGeneratedColumn({ name: 'tick_eti_id' })
    id: number;

    @Column({ name: 'tick_id', type: 'int' })
    ticketId: number;

    @Column({ name: 'eti_id', type: 'int' })
    etiquetaId: number;

    @Column({ name: 'usu_id', type: 'int' })
    usuarioId: number;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;
}

/**
 * Respuestas rápidas para errores.
 */
@Entity('tm_fast_answer')
export class RespuestaRapidaLegacy {
    @PrimaryGeneratedColumn({ name: 'answer_id' })
    id: number;

    @Column({ name: 'answer_nom', type: 'varchar', length: 150 })
    nombre: string;

    @Column({ name: 'answer_descrip', type: 'text', nullable: true })
    descripcion: string | null;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;
}

/**
 * Datos Excel subidos para autocomplete.
 */
@Entity('tm_excel_data')
export class ExcelDataLegacy {
    @PrimaryGeneratedColumn({ name: 'data_id' })
    id: number;

    @Column({ name: 'flujo_id', type: 'int' })
    flujoId: number;

    @Column({ name: 'data_nom', type: 'varchar', length: 150 })
    nombre: string;

    @Column({ name: 'datos_json', type: 'longtext' })
    datosJson: string;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;
}

/**
 * Reporte de errores en tickets (Proceso vs Info).
 */
@Entity('tm_ticket_error')
export class TicketErrorLegacy {
    @PrimaryGeneratedColumn({ name: 'error_id' })
    id: number;

    @Column({ name: 'tick_id', type: 'int' })
    ticketId: number;

    @Column({ name: 'usu_id_reporta', type: 'int' })
    usuarioReportaId: number;

    @Column({ name: 'usu_id_responsable', type: 'int' })
    usuarioResponsableId: number;

    @Column({ name: 'answer_id', type: 'int' })
    fastAnswerId: number;

    @Column({ name: 'error_descrip', type: 'text' })
    descripcion: string;

    /** 0: Info, 1: Proceso */
    @Column({ name: 'es_error_proceso', type: 'int' })
    esErrorProceso: number;

    @Column({ name: 'fech_crea', type: 'datetime' })
    fechaCreacion: Date;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;
}
