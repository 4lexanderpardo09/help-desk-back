import { Subcategoria } from 'src/modules/subcategories/entities/subcategoria.entity';
import { Ticket } from 'src/modules/tickets/entities/ticket.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('td_prioridad')
export class Prioridad {
    @PrimaryGeneratedColumn({ name: 'pd_id' })
    id: number;

    @Column({ name: 'pd_nom', type: 'varchar', length: 255, nullable: true })
    nombre: string | null;

    @Column({ name: 'est', type: 'int', nullable: true })
    estado: number | null;

    @OneToMany(() => Subcategoria, (s) => s.prioridad)
    subcategoria: Subcategoria[];

    @OneToMany(() => Ticket, (t) => t.prioridad)
    tickets: Ticket[];
}
