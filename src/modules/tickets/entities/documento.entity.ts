import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('td_documento')
export class Documento {
    @PrimaryGeneratedColumn({ name: 'doc_id' })
    id: number;

    @Column({ name: 'tick_id', type: 'int' })
    ticketId: number;

    @Column({ name: 'doc_nom', type: 'varchar', length: 400 })
    nombre: string;

    @Column({ name: 'fech_crea', type: 'datetime' })
    fechaCreacion: Date;

    @Column({ name: 'est', type: 'int' })
    estado: number;

    // TODO: Agregar relaciones ManyToOne
    // @ManyToOne(() => Ticket)
    // @JoinColumn({ name: 'tick_id' })
    // ticket: Ticket;
}
