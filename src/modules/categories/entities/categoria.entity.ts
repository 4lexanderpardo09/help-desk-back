import { Subcategoria } from 'src/modules/subcategories/entities/subcategoria.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn, ManyToMany, JoinTable } from 'typeorm';
// import { CategoriaDepartamento } from './categoria-departamento.entity';
// import { CategoriaEmpresa } from './categoria-empresa.entity';
import { Ticket } from 'src/modules/tickets/entities/ticket.entity';
import { Departamento } from 'src/modules/departments/entities/departamento.entity';
import { Empresa } from 'src/modules/companies/entities/empresa.entity';

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

    @ManyToMany(() => Departamento, (departamento) => departamento.categorias)
    @JoinTable({
        name: 'categoria_departamento',
        joinColumn: { name: 'cat_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'dp_id', referencedColumnName: 'id' },
    })
    departamentos: Departamento[];

    @ManyToMany(() => Empresa, (empresa) => empresa.categorias)
    empresas: Empresa[];

    @OneToMany(() => Ticket, (t) => t.categoria)
    tickets: Ticket[];
}
