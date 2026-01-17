
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('tm_rol')
export class Role {
    @PrimaryGeneratedColumn({ name: 'rol_id' })
    id: number;

    @Column({ name: 'rol_nom', type: 'varchar', length: 50 })
    nombre: string;

    @Column({ name: 'rol_desc', type: 'varchar', length: 255, nullable: true })
    descripcion: string | null;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;

    @OneToMany(() => User, (user) => user.role)
    usuarios: User[];
}
