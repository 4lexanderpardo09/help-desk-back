import { Cargo } from 'src/modules/positions/entities/cargo.entity';
import { Entity, JoinColumn, ManyToOne, PrimaryColumn} from 'typeorm';
import { ReglaMapeo } from './regla-mapeo.entity';

@Entity('regla_creadores')
export class ReglaCreadores {
    @PrimaryColumn({ name: 'regla_id', type: 'int' })
    reglaId: number;

    @PrimaryColumn({ name: 'creador_car_id', type: 'int' })
    creadorCargoId: number;

    @ManyToOne(() => Cargo, (c) => c.reglasCreadores)
    @JoinColumn({ name: 'creador_car_id' })
    cargo: Cargo;

    @ManyToOne(() => ReglaMapeo, (rm) => rm.creadores)
    @JoinColumn({ name: 'regla_id' })
    regla: ReglaMapeo;
}