import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CategoriaDepartamento } from 'src/modules/categories/entities/categoria-departamento.entity';

@Entity('tm_departamento')
export class Departamento {
    @PrimaryGeneratedColumn({ name: 'dp_id', comment: 'Primary Key' })
    id: number;

    @Column({ name: 'dp_nom', type: 'varchar', length: 100, nullable: true })
    nombre: string | null;

    @Column({ name: 'fech_crea', type: 'datetime', nullable: true })
    fechaCreacion: Date | null;

    @Column({ name: 'fech_modi', type: 'datetime', nullable: true })
    fechaModificacion: Date | null;

    @Column({ name: 'fech_elim', type: 'datetime', nullable: true })
    fechaEliminacion: Date | null;

    @Column({ name: 'est', type: 'int', nullable: true })
    estado: number | null;

    @OneToMany(() => User, (user) => user.departamento)
    usuarios: User[];

    @OneToMany(() => CategoriaDepartamento, (cd) => cd.departamento)
    categoriaDepartamento: CategoriaDepartamento[];    
}
