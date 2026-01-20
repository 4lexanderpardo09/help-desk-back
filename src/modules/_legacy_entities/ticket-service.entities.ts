import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * Campos dinámicos configurados por paso de flujo.
 */
@Entity('tm_campo_plantilla')
export class CampoPlantillaLegacy {
    @PrimaryGeneratedColumn({ name: 'campo_id' })
    id: number;

    @Column({ name: 'paso_id', type: 'int' })
    pasoId: number;

    @Column({ name: 'campo_nombre', type: 'varchar', length: 150 })
    nombre: string;

    @Column({ name: 'campo_codigo', type: 'varchar', length: 100 })
    codigo: string;

    @Column({ name: 'coord_x', type: 'decimal', precision: 10, scale: 2, default: 0 })
    coordX: number;

    @Column({ name: 'coord_y', type: 'decimal', precision: 10, scale: 2, default: 0 })
    coordY: number;

    @Column({ name: 'pagina', type: 'int', default: 1 })
    pagina: number;

    @Column({ name: 'campo_tipo', type: 'varchar', length: 50, default: 'text' })
    tipo: string;

    @Column({ name: 'font_size', type: 'int', default: 10 })
    fontSize: number;

    @Column({ name: 'campo_trigger', type: 'int', default: 0 })
    esTrigger: number;

    @Column({ name: 'campo_query', type: 'text', nullable: true })
    queryAutocomplete: string | null;

    @Column({ name: 'mostrar_dias_transcurridos', type: 'int', default: 0 })
    mostrarDiasTranscurridos: number;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;
}

/**
 * Valores de campos dinámicos por ticket.
 */
@Entity('td_ticket_campo_valor')
export class TicketCampoValorLegacy {
    @PrimaryGeneratedColumn({ name: 'valor_id' })
    id: number;

    @Column({ name: 'tick_id', type: 'int' })
    ticketId: number;

    @Column({ name: 'campo_id', type: 'int' })
    campoId: number;

    @Column({ name: 'valor', type: 'text' })
    valor: string;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;
}

/**
 * Notificaciones in-app.
 */
@Entity('tm_notificacion')
export class NotificacionLegacy {
    @PrimaryGeneratedColumn({ name: 'not_id' })
    id: number;

    @Column({ name: 'usu_id', type: 'int' })
    usuarioId: number;

    @Column({ name: 'not_contenido', type: 'text' })
    contenido: string;

    @Column({ name: 'tick_id', type: 'int', nullable: true })
    ticketId: number | null;

    @Column({ name: 'fech_not', type: 'datetime' })
    fecha: Date;

    /** 2=Nueva, 1=Enviada, 0=Leída */
    @Column({ name: 'est', type: 'int', default: 2 })
    estado: number;
}

/**
 * Tickets paralelos (Fork en pasos paralelos).
 */
@Entity('tm_ticket_paralelo')
export class TicketParaleloLegacy {
    @PrimaryGeneratedColumn({ name: 'paralelo_id' })
    id: number;

    @Column({ name: 'tick_id', type: 'int' })
    ticketId: number;

    @Column({ name: 'paso_id', type: 'int' })
    pasoId: number;

    @Column({ name: 'usu_id', type: 'int' })
    usuarioId: number;

    @Column({ name: 'completado', type: 'int', default: 0 })
    completado: number;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;
}
