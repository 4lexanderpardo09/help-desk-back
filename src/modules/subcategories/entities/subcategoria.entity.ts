import { Categoria } from 'src/modules/categories/entities/categoria.entity';
import { Prioridad } from 'src/modules/priorities/entities/prioridad.entity';
import { ReglaMapeo } from 'src/modules/rules/entities/regla-mapeo.entity';
import { Ticket } from 'src/modules/tickets/entities/ticket.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tm_subcategoria')
export class Subcategoria {
    @PrimaryGeneratedColumn({ name: 'cats_id' })
    id: number;

    @Column({ name: 'cat_id', type: 'int', nullable: true })
    categoriaId: number | null;

    @Column({ name: 'pd_id', type: 'int', nullable: true, comment: 'Prioridad por defecto' })
    prioridadId: number | null;

    @Column({ name: 'cats_nom', type: 'varchar', length: 255, nullable: true })
    nombre: string | null;

    @Column({ name: 'cats_descrip', type: 'mediumtext', nullable: true })
    descripcion: string | null;

    @Column({ name: 'est', type: 'int', nullable: true })
    estado: number | null;

    @OneToMany(() => ReglaMapeo, (rm) => rm.subcategoria)
    reglaMapeo: ReglaMapeo[];

    @ManyToOne(() => Categoria, (c) => c.subcategorias)
    @JoinColumn({ name: 'cat_id' })
    categoria: Categoria;

    @ManyToOne(() => Prioridad, (p) => p.subcategoria)
    @JoinColumn({ name: 'pd_id' })
    prioridad: Prioridad;

    @OneToMany(() => Ticket, (t) => t.subcategoria)
    tickets: Ticket[];
}
