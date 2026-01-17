import { Subcategoria } from 'src/modules/subcategories/entities/subcategoria.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CategoriaDepartamento } from './categoria-departamento.entity';
import { CategoriaEmpresa } from './categoria-empresa.entity';
import { Ticket } from 'src/modules/tickets/entities/ticket.entity';

@Entity('tm_categoria')
export class Categoria {
    @PrimaryGeneratedColumn({ name: 'cat_id' })
    id: number;

    @Column({ name: 'cat_nom', type: 'varchar', length: 150 })
    nombre: string;

    @Column({ name: 'est', type: 'int' })
    estado: number;

    @OneToMany(() => Subcategoria, (sub) => sub.categoria)
    subcategorias: Subcategoria[];

    @OneToMany(() => CategoriaDepartamento, (cd) => cd.categoria)
    categoriaDepartamentos: CategoriaDepartamento[];

    @OneToMany(() => CategoriaEmpresa, (cd) => cd.categoria)
    categoriaEmpresa: CategoriaEmpresa[];   
    
    @OneToMany(() => Ticket, (t) => t.categoria)
    ticket: Ticket[];
}
