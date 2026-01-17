import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Flujo } from './flujo.entity';
import { RutaPaso } from './ruta-paso.entity';

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

    @ManyToOne(() => Flujo)
    @JoinColumn({ name: 'flujo_id' })
    flujo: Flujo;

    @OneToMany(() => RutaPaso, (rp) => rp.ruta)
    rutaPasos: RutaPaso[];
}
