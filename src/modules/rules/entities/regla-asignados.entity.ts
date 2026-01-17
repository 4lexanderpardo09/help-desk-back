import { Cargo } from 'src/modules/positions/entities/cargo.entity';
import { Entity, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { ReglaMapeo } from './regla-mapeo.entity';

@Entity('regla_asignados')
export class ReglaAsignados {
    @PrimaryGeneratedColumn({ name: 'regla_id', type: 'int' })
    reglaId: number;

    @PrimaryColumn({ name: 'asignado_car_id', type: 'int' })
    asignadoCargoId: number;

    @ManyToOne(() => Cargo)
    @JoinColumn({ name: 'asignado_car_id' })
    cargo: Cargo;
}
