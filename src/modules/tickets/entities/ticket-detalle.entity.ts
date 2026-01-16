import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('td_ticketdetalle')
export class TicketDetalle {
    @PrimaryGeneratedColumn({ name: 'tickd_id' })
    id: number;

    @Column({ name: 'tick_id', type: 'int' })
    ticketId: number;

    @Column({ name: 'usu_id', type: 'int' })
    usuarioId: number;

    @Column({ name: 'tickd_descrip', type: 'mediumtext' })
    descripcion: string;

    @Column({ name: 'fech_crea', type: 'datetime' })
    fechaCreacion: Date;

    @Column({ name: 'est', type: 'int' })
    estado: number;

    // TODO: Agregar relaciones
    // @ManyToOne(() => Ticket)
    // @JoinColumn({ name: 'tick_id' })
    // ticket: Ticket;

    // @ManyToOne(() => User)
    // @JoinColumn({ name: 'usu_id' })
    // usuario: User;

    // @OneToMany(() => DocumentoDetalle, (doc) => doc.ticketDetalle)
    // documentos: DocumentoDetalle[];
}
