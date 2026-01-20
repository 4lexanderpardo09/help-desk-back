/**
 * Interface que define el contrato del modelo Legacy Ticket.php
 * Ubicación original: legacy_models/Ticket.php
 * 
 * Esta interfaz sirve para documentar la lógica de negocio exacta que existía
 * en el sistema PHP, para asegurar una migración sin pérdida de funcionalidad.
 */
export interface LegacyTicketModel {
    /**
     * Actualiza el asignado y el paso del flujo.
     * Side effects:
     * - Update tm_ticket
     * - Insert th_ticket_asignacion
     * - Insert tm_notificacion (si asignado != asignador)
     */
    update_asignacion_y_paso(
        tick_id: number,
        usu_asig: number,
        paso_actual_id: number,
        quien_asigno_id: number,
        asig_comentario?: string,
        notification_message?: string
    ): Promise<any>;

    /**
     * Cierra el ticket y añade nota final.
     * Side effects:
     * - Update tm_ticket (tick_estado='Cerrado', fech_cierre=NOW)
     * - Insert td_ticketdetalle (nota cierre)
     * - Manejo de archivos (DocumentoCierre)
     * - Notificación masiva a involucrados (creador + asignados históricos)
     */
    cerrar_ticket_con_nota(
        tick_id: number,
        usu_id: number,
        nota_cierre: string,
        files: any[] // $_FILES structure
    ): Promise<void>;

    /**
     * Listado principal para usuarios solicitantes.
     * Filtra por usu_id (dueño).
     * Soporta búsqueda fulltext en descripciones y detalles.
     */
    listar_ticket_x_usuario(
        usu_id: number,
        search_term?: string,
        status?: string,
        fech_crea_start?: string,
        fech_crea_end?: string,
        tick_id?: number,
        cats_id?: number,
        eti_id?: number,
        start?: number,
        length?: number,
        order_column?: number,
        order_dir?: string,
        usu_nom?: string,
        emp_id?: number
    ): Promise<{ data: any[]; recordsTotal: number; recordsFiltered: number }>;

    /**
     * Listado para agentes de soporte.
     * Filtra por usu_asig (asignación actual O histórica si está cerrado).
     */
    listar_ticket_x_agente(
        usu_asig: number,
        search_term?: string,
        status?: string,
        fech_crea_start?: string,
        fech_crea_end?: string,
        tick_id?: number,
        cats_id?: number,
        eti_id?: number,
        start?: number,
        length?: number,
        order_column?: number,
        order_dir?: string,
        usu_nom?: string,
        emp_id?: number
    ): Promise<{ data: any[]; recordsTotal: number; recordsFiltered: number }>;

    /**
     * Listado general (Admin/Dashboard).
     */
    listar_ticket(
        search_term?: string,
        status?: string,
        fech_crea_start?: string,
        fech_crea_end?: string,
        tick_id?: number,
        cats_id?: number,
        eti_id?: number,
        start?: number,
        length?: number,
        order_column?: number,
        order_dir?: string,
        usu_nom?: string,
        emp_id?: number
    ): Promise<{ data: any[]; recordsTotal: number; recordsFiltered: number }>;

    /**
     * Obtiene detalles (comentarios) de un ticket.
     * Join con tm_usuario y td_documento_detalle.
     */
    listar_ticketdetalle_x_ticket(tick_id: number): Promise<any[]>;

    /**
     * Obtiene info cabecera de un ticket con joins a todas las tablas de catálogo.
     */
    listar_ticket_x_id(tick_id: number): Promise<any>;

    /**
     * Construye el timeline completo del ticket.
     * UNION de:
     * - Creación (tm_ticket)
     * - Comentarios (td_ticketdetalle)
     * - Asignaciones (th_ticket_asignacion)
     * - Cierre (tm_ticket update)
     */
    listar_historial_completo(tick_id: number): Promise<any[]>;
}

// TODO: Implementar esta lógica en TicketsService usando QueryBuilder y transacciones.
