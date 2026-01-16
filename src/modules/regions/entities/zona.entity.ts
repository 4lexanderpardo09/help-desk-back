import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tm_zona')
export class Zona {
    @PrimaryGeneratedColumn({ name: 'zona_id' })
    id: number;

    @Column({ name: 'zona_nom', type: 'varchar', length: 150 })
    nombre: string;

    @Column({ name: 'est', type: 'int', default: 1, nullable: true })
    estado: number | null;

    // TODO: Agregar relaciones OneToMany
    // @OneToMany(() => Regional, (regional) => regional.zona)
    // regionales: Regional[];
}
