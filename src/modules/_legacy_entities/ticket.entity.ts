import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * @deprecated Legacy Entity for Migration Analysis
 * Mapeo exacto de la tabla `tm_ticket` tal como era utilizada por el modelo PHP `Ticket.php`.
 * 
 * Estrategia de asignación:
 * El campo `usu_asig` almacena una lista de IDs separados por coma (ej: "1,2,3").
 * Esto permitía asignación múltiple sin una tabla normalizada intermedia (aunque existía `th_ticket_asignacion` para histórico).
 */
@Entity('tm_ticket')
export class TicketLegacy {
    @PrimaryGeneratedColumn({ name: 'tick_id' })
    id: number;

    /** Solicitante del ticket */
    @Column({ name: 'usu_id', type: 'int' })
    usuarioId: number;

    /** Categoría seleccionada */
    @Column({ name: 'cat_id', type: 'int' })
    categoriaId: number;

    /** Subcategoría (opcional) */
    @Column({ name: 'cats_id', type: 'int', nullable: true })
    subcategoriaId: number | null;

    /** Prioridad asignada */
    @Column({ name: 'pd_id', type: 'int', nullable: true })
    prioridadId: number | null;

    /** Empresa del solicitante (Snapshot o FK) */
    @Column({ name: 'emp_id', type: 'int' })
    empresaId: number;

    /** Departamento del solicitante */
    @Column({ name: 'dp_id', type: 'int' })
    departamentoId: number;

    /** Regional del solicitante (puede ser null) */
    @Column({ name: 'reg_id', type: 'int', nullable: true })
    regionalId: number | null;

    /** ID del paso actual en el flujo de trabajo (`tm_flujo_paso`) */
    @Column({ name: 'paso_actual_id', type: 'int', nullable: true })
    pasoActualId: number | null;

    @Column({ name: 'tick_titulo', type: 'varchar', length: 250 })
    titulo: string;

    @Column({ name: 'tick_descrip', type: 'mediumtext' })
    descripcion: string;

    @Column({ name: 'tick_estado', type: 'enum', enum: ['Abierto', 'Cerrado', 'Pausado'], default: 'Abierto', nullable: true })
    ticketEstado: 'Abierto' | 'Cerrado' | 'Pausado' | null;

    /** Flag de error en proceso (Legacy logic) */
    @Column({ name: 'error_proceso', type: 'int', nullable: true })
    errorProceso: number | null;

    @Column({ name: 'fech_crea', type: 'datetime', nullable: true })
    fechaCreacion: Date | null;

    /**
     * IDs de usuarios asignados.
     * Legacy: String "1,2,3" usado con FIND_IN_SET().
     * Moderno: Array number[] (vía transformer).
     */
    @Column({
        name: 'usu_asig',
        type: 'varchar',
        length: 255,
        nullable: true,
        comment: 'Legacy: CSV string of user IDs',
    })
    usuarioAsignadoRaw: string | null;

    /** Quién asignó el ticket (ID usuario) */
    @Column({ name: 'how_asig', type: 'int', nullable: true })
    usuarioAsignadorId: number | null;

    /** Orden del paso en la ruta */
    @Column({ name: 'ruta_paso_orden', type: 'int', default: 0, nullable: true })
    rutaPasoOrden: number | null;

    /** ID de la ruta de flujo asociada */
    @Column({ name: 'ruta_id', type: 'int', default: 0, nullable: true })
    rutaId: number | null;

    @Column({ name: 'fech_cierre', type: 'datetime', nullable: true })
    fechaCierre: Date | null;

    /** Estado lógico (1=Activo, 0=Eliminado) */
    @Column({ name: 'est', type: 'int' })
    estado: number;

    /** Jefe aprobador (para flujos de aprobación) */
    @Column({ name: 'usu_id_jefe_aprobador', type: 'int', nullable: true })
    usuarioJefeAprobadorId: number | null;

    /*
     * NOTA: Las relaciones se omiten en esta entidad Legacy para centrarse 
     * puramente en la estructura de tabla base que manipulaba el modelo PHP.
     * Consultar `src/modules/tickets/entities/ticket.entity.ts` para el grafo completo.
     */
}
