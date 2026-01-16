import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tm_flujo_paso_firma')
export class PasoFlujoFirma {
    @PrimaryGeneratedColumn({ name: 'firma_id' })
    id: number;

    @Column({ name: 'paso_id', type: 'int' })
    pasoId: number;

    @Column({ name: 'usu_id', type: 'int', nullable: true })
    usuarioId: number | null;

    @Column({ name: 'car_id', type: 'int', nullable: true })
    cargoId: number | null;

    @Column({ name: 'coord_x', type: 'float' })
    coordX: number;

    @Column({ name: 'coord_y', type: 'float' })
    coordY: number;

    @Column({ name: 'pagina', type: 'int', default: 1, nullable: true })
    pagina: number | null;

    @Column({ name: 'est', type: 'int', default: 1, nullable: true })
    estado: number | null;

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
