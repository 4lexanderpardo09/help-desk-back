import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Perfil } from './perfil.entity';

@Entity('tm_usuario_perfiles')
export class UsuarioPerfil {
    @PrimaryGeneratedColumn({ name: 'usu_per_id' })
    id: number;

    @Column({ name: 'usu_id', type: 'int' })
    usuarioId: number;

    @Column({ name: 'per_id', type: 'int' })
    perfilId: number;

    @Column({ name: 'fech_crea', type: 'datetime', default: () => 'CURRENT_TIMESTAMP', nullable: true })
    fechaCreacion: Date | null;

    @Column({ name: 'est', type: 'int', default: 1, nullable: true })
    estado: number | null;

    @ManyToOne(() => User, (user) => user.usuarioPerfiles)
    @JoinColumn({ name: 'usu_id' })
    usuario: User;

    @ManyToOne(() => Perfil, (perfil) => perfil.usuarioPerfiles)
    @JoinColumn({ name: 'per_id' })
    perfil: Perfil;
}
