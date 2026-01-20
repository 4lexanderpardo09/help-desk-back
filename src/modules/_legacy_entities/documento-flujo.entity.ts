import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * Documentos generados y firmados durante el flujo (PDFs de pasos).
 * Diferente a los adjuntos normales de tickets.
 */
@Entity('tm_documento_flujo')
export class DocumentoFlujoLegacy {
    @PrimaryGeneratedColumn({ name: 'doc_flujo_id' })
    id: number;

    @Column({ name: 'tick_id', type: 'int' })
    ticketId: number;

    @Column({ name: 'flujo_id', type: 'int' })
    flujoId: number;

    @Column({ name: 'paso_id', type: 'int' })
    pasoId: number;

    @Column({ name: 'usu_id', type: 'int' })
    usuarioId: number;

    @Column({ name: 'doc_nom', type: 'varchar', length: 255 })
    nombreArchivo: string;

    @Column({ name: 'fech_crea', type: 'datetime' })
    fechaCreacion: Date;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;
}
