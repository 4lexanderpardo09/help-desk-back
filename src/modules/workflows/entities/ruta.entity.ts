import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tm_ruta')
export class Ruta {
    @PrimaryGeneratedColumn({ name: 'ruta_id' })
    id: number;

    @Column({ name: 'flujo_id', type: 'int' })
    flujoId: number;

    @Column({ name: 'ruta_nombre', type: 'varchar', length: 150 })
    nombre: string;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;

    // TODO: Agregar relaciones
    // @ManyToOne(() => Flujo)
    // @JoinColumn({ name: 'flujo_id' })
    // flujo: Flujo;

    // @OneToMany(() => FlujoTransicion, (ft) => ft.ruta)
    // transiciones: FlujoTransicion[];
}
