import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Categoria } from './categoria.entity';
import { Empresa } from 'src/modules/companies/entities/empresa.entity';

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

    @ManyToOne(() => Categoria, (c) => c.categoriaEmpresa)
    categoria: Categoria[];

    @ManyToOne(() => Empresa, (e) => e.categoriaEmpresa)
    empresa: Empresa[];
}
