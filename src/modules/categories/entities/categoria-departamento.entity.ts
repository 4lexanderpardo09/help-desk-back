import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Categoria } from './categoria.entity';
import { Departamento } from 'src/modules/departments/entities/departamento.entity';

@Entity('categoria_departamento')
export class CategoriaDepartamento {
    @PrimaryGeneratedColumn({ name: 'catdp_id', comment: 'Primary Key' })
    id: number;

    @Column({ name: 'cat_id', type: 'int', nullable: true })
    categoriaId: number | null;

    @Column({ name: 'dp_id', type: 'int', nullable: true })
    departamentoId: number | null;

    @Column({ name: 'fech_crea', type: 'datetime', nullable: true })
    fechaCreacion: Date | null;

    @Column({ name: 'fech_elim', type: 'datetime', nullable: true })
    fechaEliminacion: Date | null;

    @Column({ name: 'est', type: 'int', nullable: true })
    estado: number | null;

    @ManyToOne(() => Categoria, (c) => c.categoriaDepartamentos)
    @JoinColumn({ name: 'cat_id' })
    categoria: Categoria;

    @ManyToOne(() => Departamento, (d) => d.categoriaDepartamento)
    @JoinColumn({ name: 'dp_id' })
    departamento: Departamento;
}
