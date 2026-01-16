import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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

    // TODO: Agregar relaciones ManyToOne
    // @ManyToOne(() => User)
    // @JoinColumn({ name: 'usu_id' })
    // usuario: User;

    // @ManyToOne(() => Perfil)
    // @JoinColumn({ name: 'per_id' })
    // perfil: Perfil;
}
