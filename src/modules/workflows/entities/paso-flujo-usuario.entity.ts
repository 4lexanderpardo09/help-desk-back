import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PasoFlujo } from './paso-flujo.entity';
import { User } from '../../users/entities/user.entity';
import { Cargo } from '../../positions/entities/cargo.entity';

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

    @ManyToOne(() => PasoFlujo, (p) => p.usuarios)
    @JoinColumn({ name: 'paso_id' })
    paso: PasoFlujo;

    @ManyToOne(() => User, (u) => u.pasosFlujoAsignados)
    @JoinColumn({ name: 'usu_id' })
    usuario: User;

    @ManyToOne(() => Cargo, (c) => c.usuariosFlujo)
    @JoinColumn({ name: 'car_id' })
    cargo: Cargo;
}
