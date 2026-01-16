import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('td_prioridad')
export class Prioridad {
    @PrimaryGeneratedColumn({ name: 'pd_id' })
    id: number;

    @Column({ name: 'pd_nom', type: 'varchar', length: 255, nullable: true })
    nombre: string | null;

    @Column({ name: 'est', type: 'int', nullable: true })
    estado: number | null;
}
