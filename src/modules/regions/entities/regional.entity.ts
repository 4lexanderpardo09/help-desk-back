import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tm_regional')
export class Regional {
    @PrimaryGeneratedColumn({ name: 'reg_id' })
    id: number;

    @Column({ name: 'reg_nom', type: 'varchar', length: 150 })
    nombre: string;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;

    @Column({ name: 'zona_id', type: 'int', nullable: true })
    zonaId: number | null;

    // TODO: Agregar relaciones ManyToOne
    // @ManyToOne(() => Zona)
    // @JoinColumn({ name: 'zona_id' })
    // zona: Zona;
}
