import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('td_documento_detalle')
export class DocumentoDetalle {
    @PrimaryGeneratedColumn({ name: 'det_id' })
    id: number;

    @Column({ name: 'tickd_id', type: 'int', comment: 'ID del detalle del ticket al que pertenece' })
    ticketDetalleId: number;

    @Column({ name: 'det_nom', type: 'varchar', length: 200 })
    nombre: string;

    @Column({ name: 'fech_crea', type: 'datetime', nullable: true })
    fechaCreacion: Date | null;

    @Column({ name: 'est', type: 'int' })
    estado: number;

    // TODO: Agregar relaciones ManyToOne
    // @ManyToOne(() => TicketDetalle)
    // @JoinColumn({ name: 'tickd_id' })
    // ticketDetalle: TicketDetalle;
}
