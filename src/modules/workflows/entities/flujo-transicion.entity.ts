import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tm_flujo_transiciones')
export class FlujoTransicion {
    @PrimaryGeneratedColumn({ name: 'transicion_id' })
    id: number;

    @Column({ name: 'paso_origen_id', type: 'int' })
    pasoOrigenId: number;

    @Column({ name: 'ruta_id', type: 'int', nullable: true })
    rutaId: number | null;

    @Column({ name: 'paso_destino_id', type: 'int', nullable: true })
    pasoDestinoId: number | null;

    @Column({ name: 'condicion_clave', type: 'varchar', length: 50, nullable: true })
    condicionClave: string | null;

    @Column({ name: 'condicion_nombre', type: 'varchar', length: 150 })
    condicionNombre: string;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;

    // TODO: Agregar relaciones ManyToOne
    // @ManyToOne(() => PasoFlujo)
    // @JoinColumn({ name: 'paso_origen_id' })
    // pasoOrigen: PasoFlujo;

    // @ManyToOne(() => PasoFlujo)
    // @JoinColumn({ name: 'paso_destino_id' })
    // pasoDestino: PasoFlujo;

    // @ManyToOne(() => Ruta) // Si existe la entidad Ruta referenciada por ruta_id
    // @JoinColumn({ name: 'ruta_id' })
    // ruta: Ruta;
}
