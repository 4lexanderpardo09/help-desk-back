import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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

    // TODO: Agregar relaciones ManyToOne
    // @ManyToOne(() => Cargo)
    // @JoinColumn({ name: 'car_id' })
    // cargo: Cargo;

    // @ManyToOne(() => Cargo)
    // @JoinColumn({ name: 'jefe_car_id' })
    // jefeCargo: Cargo;
}
