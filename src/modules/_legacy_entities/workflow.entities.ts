import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tm_flujo')
export class FlujoLegacy {
    @PrimaryGeneratedColumn({ name: 'flujo_id' })
    id: number;

    @Column({ name: 'flujo_nom', type: 'varchar', length: 150 })
    nombre: string;

    @Column({ name: 'cats_id', type: 'int' })
    subcategoriaId: number;

    /** Nombre del archivo adjunto plantilla (PDF/Doc) */
    @Column({ name: 'flujo_nom_adjunto', type: 'varchar', length: 250, nullable: true })
    adjuntoNombre: string | null;

    @Column({ name: 'usu_id_observador', type: 'int', nullable: true })
    usuarioObservadorId: number | null;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;
}

@Entity('tm_flujo_paso')
export class FlujoPasoLegacy {
    @PrimaryGeneratedColumn({ name: 'paso_id' })
    id: number;

    @Column({ name: 'flujo_id', type: 'int' })
    flujoId: number;

    @Column({ name: 'paso_orden', type: 'int' })
    orden: number;

    @Column({ name: 'paso_nombre', type: 'varchar', length: 150 })
    nombre: string;

    @Column({ name: 'paso_descripcion', type: 'text', nullable: true })
    descripcion: string | null;

    @Column({ name: 'paso_tiempo_habil', type: 'int', default: 0 })
    tiempoHabilHoras: number;

    // --- Configuration Flags ---
    @Column({ name: 'cargo_id_asignado', type: 'int', nullable: true })
    cargoAsignadoId: number | null;

    @Column({ name: 'requiere_seleccion_manual', type: 'int', default: 0 })
    requiereSeleccionManual: number;

    @Column({ name: 'es_tarea_nacional', type: 'int', default: 0 })
    esTareaNacional: number;

    @Column({ name: 'es_aprobacion', type: 'int', default: 0 })
    esAprobacion: number;

    @Column({ name: 'permite_cerrar', type: 'int', default: 0 })
    permiteCerrar: number;

    @Column({ name: 'necesita_aprobacion_jefe', type: 'int', default: 0 })
    necesitaAprobacionJefe: number;

    @Column({ name: 'es_paralelo', type: 'int', default: 0 })
    esParalelo: number;

    @Column({ name: 'requiere_firma', type: 'int', default: 0 })
    requiereFirma: number;

    @Column({ name: 'asignar_a_creador', type: 'int', default: 0 })
    asignarACreador: number;

    /** ID del campo plantilla que contiene ID del jefe (si aplica) */
    @Column({ name: 'campo_id_referencia_jefe', type: 'int', nullable: true })
    campoIdReferenciaJefe: number | null;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;
}

@Entity('tm_flujo_transiciones')
export class FlujoTransicionLegacy {
    @PrimaryGeneratedColumn({ name: 'transicion_id' })
    id: number;

    @Column({ name: 'paso_origen_id', type: 'int' })
    pasoOrigenId: number;

    /** Destino A: Paso específico */
    @Column({ name: 'paso_destino_id', type: 'int', nullable: true })
    pasoDestinoId: number | null;

    /** Destino B: Ruta completa (Sub-flujo) */
    @Column({ name: 'ruta_id', type: 'int', nullable: true })
    rutaDestinoId: number | null;

    /** Clave de decisión (ej: 'APROBADO', 'RECHAZADO') */
    @Column({ name: 'condicion_clave', type: 'varchar', length: 50 })
    condicionClave: string;

    /** Texto legible (ej: 'Aprobar Solicitud') */
    @Column({ name: 'condicion_nombre', type: 'varchar', length: 150 })
    condicionNombre: string;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;
}

@Entity('tm_ruta')
export class RutaLegacy {
    @PrimaryGeneratedColumn({ name: 'ruta_id' })
    id: number;

    @Column({ name: 'flujo_id', type: 'int' })
    flujoId: number;

    @Column({ name: 'ruta_nombre', type: 'varchar', length: 150 })
    nombre: string;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;
}

@Entity('tm_ruta_paso')
export class RutaPasoLegacy {
    @PrimaryGeneratedColumn({ name: 'ruta_paso_id' })
    id: number;

    @Column({ name: 'ruta_id', type: 'int' })
    rutaId: number;

    @Column({ name: 'paso_id', type: 'int' })
    pasoId: number;

    @Column({ name: 'orden', type: 'int' })
    orden: number;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;
}
