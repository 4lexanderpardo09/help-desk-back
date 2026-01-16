import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Regional } from './regional.entity';

@Entity('tm_zona')
export class Zona {
    @PrimaryGeneratedColumn({ name: 'zona_id' })
    id: number;

    @Column({ name: 'zona_nom', type: 'varchar', length: 150 })
    nombre: string;

    @Column({ name: 'est', type: 'int', default: 1, nullable: true })
    estado: number | null;

    @OneToMany(() => Regional, (regional) => regional.zona)
    regionales: Regional[];
}
