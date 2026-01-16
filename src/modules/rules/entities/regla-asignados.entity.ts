import { Entity, PrimaryColumn } from 'typeorm';

@Entity('regla_asignados')
export class ReglaAsignados {
    @PrimaryColumn({ name: 'regla_id', type: 'int' })
    reglaId: number;

    @PrimaryColumn({ name: 'asignado_car_id', type: 'int' })
    asignadoCargoId: number;

    // TODO: Agregar relaciones ManyToOne
    // @ManyToOne(() => Regla)
    // @JoinColumn({ name: 'regla_id' })
    // regla: Regla;

    // @ManyToOne(() => Cargo)
    // @JoinColumn({ name: 'asignado_car_id' })
    // cargo: Cargo;
}
