import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('td_empresa')
export class Empresa {
    @PrimaryGeneratedColumn({ name: 'emp_id', comment: 'Primary Key' })
    id: number;

    @Column({ name: 'emp_nom', type: 'varchar', length: 100, nullable: true })
    nombre: string | null;

    @Column({ name: 'fech_crea', type: 'datetime', nullable: true })
    fechaCreacion: Date | null;

    @Column({ name: 'fech_elim', type: 'datetime', nullable: true })
    fechaEliminacion: Date | null;

    @Column({ name: 'est', type: 'int', nullable: true })
    estado: number | null;

    // TODO: Agregar relaciones OneToMany
    // @OneToMany(() => EmpresaUsuario, (eu) => eu.empresa)
    // usuarios: EmpresaUsuario[];

    // @OneToMany(() => CategoriaEmpresa, (ce) => ce.empresa)
    // categorias: CategoriaEmpresa[];
}
