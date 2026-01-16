import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('categoria_empresa')
export class CategoriaEmpresa {
    @PrimaryGeneratedColumn({ name: 'catemp_id', comment: 'Primary Key' })
    id: number;

    @Column({ name: 'cat_id', type: 'int', nullable: true })
    categoriaId: number | null;

    @Column({ name: 'emp_id', type: 'int', nullable: true })
    empresaId: number | null;

    @Column({ name: 'fech_crea', type: 'datetime', nullable: true })
    fechaCreacion: Date | null;

    @Column({ name: 'fech_elim', type: 'datetime', nullable: true })
    fechaEliminacion: Date | null;

    @Column({ name: 'est', type: 'int', nullable: true })
    estado: number | null;

    // TODO: Agregar relaciones cuando existan Entidades Categoria y Empresa
}
