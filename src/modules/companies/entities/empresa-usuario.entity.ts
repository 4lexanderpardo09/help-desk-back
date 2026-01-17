import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Empresa } from './empresa.entity';
import { User } from '../../users/entities/user.entity';

@Entity('empresa_usuario')
export class EmpresaUsuario {
    @PrimaryGeneratedColumn({ name: 'empusu_id', comment: 'Primary Key' })
    id: number;

    @Column({ name: 'usu_id', type: 'int', nullable: true })
    usuarioId: number | null;

    @Column({ name: 'emp_id', type: 'int', nullable: true })
    empresaId: number | null;

    @Column({ name: 'fech_crea', type: 'datetime', nullable: true })
    fechaCreacion: Date | null;

    @Column({ name: 'fech_elim', type: 'datetime', nullable: true })
    fechaEliminacion: Date | null;

    @Column({ name: 'est', type: 'int', nullable: true })
    estado: number | null;

    @ManyToOne(() => User, (user) => user.empresaUsuarios)
    @JoinColumn({ name: 'usu_id' })
    usuario: User;
    
    @ManyToOne(() => Empresa, (empresa) => empresa.empresaUsuarios)
    @JoinColumn({ name: 'emp_id' })
    empresa: Empresa;

}
