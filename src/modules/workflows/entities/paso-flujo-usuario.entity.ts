import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tm_flujo_paso_usuarios')
export class PasoFlujoUsuario {
    @PrimaryGeneratedColumn({ name: 'id' })
    id: number;

    @Column({ name: 'paso_id', type: 'int' })
    pasoId: number;

    @Column({ name: 'usu_id', type: 'int', nullable: true })
    usuarioId: number | null;

    @Column({ name: 'car_id', type: 'int', nullable: true })
    cargoId: number | null;

    // TODO: Agregar relaciones ManyToOne
    // @ManyToOne(() => PasoFlujo)
    // @JoinColumn({ name: 'paso_id' })
    // paso: PasoFlujo;

    // @ManyToOne(() => User)
    // @JoinColumn({ name: 'usu_id' })
    // usuario: User;

    // @ManyToOne(() => Cargo)
    // @JoinColumn({ name: 'car_id' })
    // cargo: Cargo;
}
