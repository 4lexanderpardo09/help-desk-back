import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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

    // TODO: Agregar relaciones cuando existan las entidades Categoria y Departamento
    // @ManyToOne(() => Categoria)
    // @JoinColumn({ name: 'cat_id' })
    // categoria: Categoria;

    // @ManyToOne(() => Departamento)
    // @JoinColumn({ name: 'dp_id' })
    // departamento: Departamento;
}
