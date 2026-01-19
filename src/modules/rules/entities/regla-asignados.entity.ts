import { Cargo } from 'src/modules/positions/entities/cargo.entity';
import { Entity, JoinColumn, ManyToOne, PrimaryColumn} from 'typeorm';
import { ReglaMapeo } from './regla-mapeo.entity';

@Entity('regla_asignados')
export class ReglaAsignados {
    @PrimaryColumn({ name: 'regla_id', type: 'int' })
    reglaId: number;

    @PrimaryColumn({ name: 'asignado_car_id', type: 'int' })
    asignadoCargoId: number;

    @ManyToOne(() => Cargo, (c) => c.reglasAsignados)
    @JoinColumn({ name: 'asignado_car_id' })
    cargo: Cargo;

    @ManyToOne(() => ReglaMapeo, (rm) => rm.asignados)
    @JoinColumn({ name: 'regla_id' })
    regla: ReglaMapeo;
}
