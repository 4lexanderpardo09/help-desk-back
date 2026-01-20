import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('td_documento')
export class DocumentoLegacy {
    @PrimaryGeneratedColumn({ name: 'doc_id' })
    id: number;

    @Column({ name: 'tick_id', type: 'int' })
    ticketId: number;

    @Column({ name: 'doc_nom', type: 'varchar', length: 250 })
    nombreArchivo: string;

    @Column({ name: 'fech_crea', type: 'datetime' })
    fechaCreacion: Date;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;
}

@Entity('td_documento_detalle')
export class DocumentoDetalleLegacy {
    @PrimaryGeneratedColumn({ name: 'det_id' })
    id: number;

    @Column({ name: 'tickd_id', type: 'int' })
    ticketDetalleId: number;

    @Column({ name: 'det_nom', type: 'varchar', length: 250 })
    nombreArchivo: string;

    @Column({ name: 'fech_crea', type: 'datetime' })
    fechaCreacion: Date;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;
}

@Entity('td_documento_cierre')
export class DocumentoCierreLegacy {
    @PrimaryGeneratedColumn({ name: 'doc_id' })
    id: number;

    @Column({ name: 'tick_id', type: 'int' })
    ticketId: number;

    @Column({ name: 'doc_nom', type: 'varchar', length: 250 })
    nombreArchivo: string;

    @Column({ name: 'fech_crea', type: 'datetime' })
    fechaCreacion: Date;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;
}
