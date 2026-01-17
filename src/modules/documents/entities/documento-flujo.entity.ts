import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { Flujo } from '../../workflows/entities/flujo.entity';
import { PasoFlujo } from '../../workflows/entities/paso-flujo.entity';
import { User } from '../../users/entities/user.entity';

@Entity('tm_documento_flujo')
export class DocumentoFlujo {
    @PrimaryGeneratedColumn({ name: 'doc_flujo_id' })
    id: number;

    @Column({ name: 'tick_id', type: 'int' })
    ticketId: number;

    @Column({ name: 'flujo_id', type: 'int', nullable: true })
    flujoId: number | null;

    @Column({ name: 'paso_id', type: 'int', nullable: true })
    pasoId: number | null;

    @Column({ name: 'usu_id', type: 'int', nullable: true })
    usuarioId: number | null;

    @Column({ name: 'doc_nom', type: 'varchar', length: 255 })
    nombre: string;

    @Column({ name: 'fech_crea', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    fechaCreacion: Date;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;

    @ManyToOne(() => Ticket, (t) => t.documentosFlujo)
    @JoinColumn({ name: 'tick_id' })
    ticket: Ticket;

    @ManyToOne(() => Flujo, (f) => f.documentosFlujo)
    @JoinColumn({ name: 'flujo_id' })
    flujo: Flujo;

    @ManyToOne(() => PasoFlujo, (p) => p.documentosFlujo)
    @JoinColumn({ name: 'paso_id' })
    paso: PasoFlujo;

    @ManyToOne(() => User, (u) => u.documentosFlujo)
    @JoinColumn({ name: 'usu_id' })
    usuario: User;
}
