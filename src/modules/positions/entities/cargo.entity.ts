import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tm_cargo')
export class Cargo {
    @PrimaryGeneratedColumn({ name: 'car_id' })
    id: number;

    @Column({ name: 'car_nom', type: 'varchar', length: 150 })
    nombre: string;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;

    // TODO: Agregar relaciones OneToMany
    // @OneToMany(() => User, (user) => user.cargo)
    // usuarios: User[];

    // @OneToMany(() => ReglaAsignados, (ra) => ra.cargo)
    // reglasAsignados: ReglaAsignados[];

    // @OneToMany(() => ReglaCreadores, (rc) => rc.cargo)
    // reglasCreadores: ReglaCreadores[];
}
