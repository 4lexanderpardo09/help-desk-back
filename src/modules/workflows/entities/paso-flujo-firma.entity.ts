import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PasoFlujo } from './paso-flujo.entity';
import { User } from '../../users/entities/user.entity';
import { Cargo } from '../../positions/entities/cargo.entity';

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

    @ManyToOne(() => PasoFlujo, (p) => p.firmas)
    @JoinColumn({ name: 'paso_id' })
    paso: PasoFlujo;

    @ManyToOne(() => User, (u) => u.firmasFlujo)
    @JoinColumn({ name: 'usu_id' })
    usuario: User;

    @ManyToOne(() => Cargo, (c) => c.firmasFlujo)
    @JoinColumn({ name: 'car_id' })
    cargo: Cargo;
}
