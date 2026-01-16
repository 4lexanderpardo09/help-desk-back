import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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

    // TODO: Agregar relaciones OneToMany
    // @OneToMany(() => CategoriaDepartamento, (cd) => cd.departamento)
    // categorias: CategoriaDepartamento[];
}
