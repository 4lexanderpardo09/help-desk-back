import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tm_ruta_paso')
export class RutaPaso {
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

    // TODO: Agregar relaciones ManyToOne
    // @ManyToOne(() => Ruta)
    // @JoinColumn({ name: 'ruta_id' })
    // ruta: Ruta;

    // @ManyToOne(() => PasoFlujo)
    // @JoinColumn({ name: 'paso_id' })
    // paso: PasoFlujo;
}
