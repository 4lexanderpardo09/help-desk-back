import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Zona } from './zona.entity';

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

    @ManyToOne(() => Zona, (zona) => zona.regionales)
    @JoinColumn({ name: 'zona_id' })
    zona: Zona;
}
