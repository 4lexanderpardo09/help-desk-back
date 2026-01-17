import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Flujo } from './flujo.entity';
import { Cargo } from '../../positions/entities/cargo.entity';
import { TicketParalelo } from '../../tickets/entities/ticket-paralelo.entity';
import { TicketNovedad } from '../../tickets/entities/ticket-novedad.entity';
import { TicketAsignacionHistorico } from '../../tickets/entities/ticket-asignacion-historico.entity';
import { CampoPlantilla } from '../../templates/entities/campo-plantilla.entity';

@Entity('tm_flujo_paso')
export class PasoFlujo {
    @PrimaryGeneratedColumn({ name: 'paso_id' })
    id: number;

    @Column({ name: 'flujo_id', type: 'int' })
    flujoId: number;

    @Column({ name: 'paso_orden', type: 'int' })
    orden: number;

    @Column({ name: 'paso_nombre', type: 'varchar', length: 255 })
    nombre: string;

    @Column({ name: 'cargo_id_asignado', type: 'int', nullable: true })
    cargoAsignadoId: number | null;

    @Column({ name: 'paso_tiempo_habil', type: 'int', nullable: true })
    tiempoHabil: number | null;

    @Column({ name: 'paso_descripcion', type: 'mediumtext', nullable: true })
    descripcion: string | null;

    @Column({ name: 'requiere_seleccion_manual', type: 'int', nullable: true })
    requiereSeleccionManual: number | null;

    @Column({ name: 'es_tarea_nacional', type: 'tinyint', default: 0 })
    esTareaNacional: boolean;

    @Column({ name: 'es_aprobacion', type: 'tinyint' })
    esAprobacion: boolean;

    @Column({ name: 'paso_nom_adjunto', type: 'varchar', length: 255, nullable: true })
    nombreAdjunto: string | null;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;

    @Column({ name: 'campo_id_referencia_jefe', type: 'int', nullable: true })
    campoReferenciaJefeId: number | null;

    @Column({ name: 'permite_cerrar', type: 'int', nullable: true })
    permiteCerrar: number | null;

    @Column({ name: 'necesita_aprobacion_jefe', type: 'tinyint', default: 0, nullable: true })
    necesitaAprobacionJefe: boolean | null;

    @Column({ name: 'es_paralelo', type: 'tinyint', default: 0, nullable: true })
    esParalelo: boolean | null;

    @Column({ name: 'requiere_firma', type: 'tinyint', default: 0, nullable: true })
    requiereFirma: boolean | null;

    @Column({ name: 'requiere_campos_plantilla', type: 'int', default: 0, nullable: true })
    requiereCamposPlantilla: number | null;

    @Column({ name: 'asignar_a_creador', type: 'tinyint', default: 0, nullable: true })
    asignarCreador: boolean | null;

    @Column({ name: 'cerrar_ticket_obligatorio', type: 'tinyint', default: 0, nullable: true })
    cerrarTicketObligatorio: boolean | null;

    @Column({ name: 'permite_despacho_masivo', type: 'tinyint', default: 0, nullable: true })
    permiteDespachoMasivo: boolean | null;

    @ManyToOne(() => Flujo, (f) => f.pasos)
    @JoinColumn({ name: 'flujo_id' })
    flujo: Flujo;

    @ManyToOne(() => Cargo)
    @JoinColumn({ name: 'cargo_id_asignado' })
    cargoAsignado: Cargo;

    @OneToMany(() => TicketParalelo, (tp) => tp.paso)
    ticketParalelos: TicketParalelo[];

    @OneToMany(() => TicketNovedad, (tn) => tn.pasoPausado)
    ticketNovedades: TicketNovedad[];

    @OneToMany(() => TicketAsignacionHistorico, (th) => th.paso)
    historiales: TicketAsignacionHistorico[];

    @OneToMany(() => CampoPlantilla, (cp) => cp.paso)
    campos: CampoPlantilla[];
}
