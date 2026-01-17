import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Cargo } from './cargo.entity';

@Entity('tm_organigrama')
export class Organigrama {
    @PrimaryGeneratedColumn({ name: 'org_id' })
    id: number;

    @Column({ name: 'car_id', type: 'int' })
    cargoId: number;

    @Column({ name: 'jefe_car_id', type: 'int' })
    jefeCargoId: number;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;

    @ManyToOne(() => Cargo, (c) => c.organigrama)
    @JoinColumn({ name: 'car_id' })
    cargo: Cargo;

    @ManyToOne(() => Cargo, (c) => c.organigramaJefe)
    @JoinColumn({ name: 'jefe_car_id' })
    jefeCargo: Cargo;
}
