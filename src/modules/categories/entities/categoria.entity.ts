import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tm_categoria')
export class Categoria {
    @PrimaryGeneratedColumn({ name: 'cat_id' })
    id: number;

    @Column({ name: 'cat_nom', type: 'varchar', length: 150 })
    nombre: string;

    @Column({ name: 'est', type: 'int' })
    estado: number;

    // TODO: Agregar relaciones OneToMany
    // @OneToMany(() => Subcategoria, (sub) => sub.categoria)
    // subcategorias: Subcategoria[];

    // @OneToMany(() => CategoriaDepartamento, (cd) => cd.categoria)
    // departamentos: CategoriaDepartamento[];
}
