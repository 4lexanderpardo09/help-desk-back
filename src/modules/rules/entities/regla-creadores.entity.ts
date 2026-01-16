import { Entity, PrimaryColumn } from 'typeorm';

@Entity('regla_creadores')
export class ReglaCreadores {
    @PrimaryColumn({ name: 'regla_id', type: 'int' })
    reglaId: number;

    @PrimaryColumn({ name: 'creador_car_id', type: 'int' })
    creadorCargoId: number;

    // TODO: Agregar relaciones ManyToOne
    // @ManyToOne(() => Regla)
    // @JoinColumn({ name: 'regla_id' })
    // regla: Regla;

    // @ManyToOne(() => Cargo)
    // @JoinColumn({ name: 'creador_car_id' })
    // cargo: Cargo;
}
