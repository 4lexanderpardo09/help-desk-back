import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PasoFlujo } from '../../workflows/entities/paso-flujo.entity';
import { TicketCampoValor } from '../../tickets/entities/ticket-campo-valor.entity';

@Entity('tm_campo_plantilla')
export class CampoPlantilla {
    @PrimaryGeneratedColumn({ name: 'campo_id' })
    id: number;

    @Column({ name: 'paso_id', type: 'int' })
    pasoId: number;

    @Column({ name: 'campo_nombre', type: 'varchar', length: 255 })
    nombre: string;

    @Column({ name: 'campo_codigo', type: 'varchar', length: 100 })
    codigo: string;

    @Column({ name: 'campo_tipo', type: 'varchar', length: 50, default: 'text' })
    tipo: string;

    @Column({ name: 'coord_x', type: 'decimal', precision: 10, scale: 2 })
    coordX: number;

    @Column({ name: 'coord_y', type: 'decimal', precision: 10, scale: 2 })
    coordY: number;

    @Column({ name: 'etiqueta', type: 'varchar', length: 100, nullable: true })
    etiqueta: string | null;

    @Column({ name: 'pagina', type: 'int', default: 1 })
    pagina: number;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;

    @Column({ name: 'fech_crea', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    fechaCreacion: Date;

    @Column({ name: 'font_size', type: 'int', default: 10 })
    fontSize: number;

    @Column({ name: 'campo_trigger', type: 'int', default: 0 })
    campoTrigger: number;

    @Column({ name: 'campo_query', type: 'text', nullable: true })
    campoQuery: string | null;

    @Column({ name: 'mostrar_dias_transcurridos', type: 'tinyint', default: 0 })
    mostrarDiasTranscurridos: boolean;

    @ManyToOne(() => PasoFlujo, (p) => p.campos)
    @JoinColumn({ name: 'paso_id' })
    paso: PasoFlujo;

    @OneToMany(() => TicketCampoValor, (cv) => cv.campo)
    ticketCampoValores: TicketCampoValor[];
}
