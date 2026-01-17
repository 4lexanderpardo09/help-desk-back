import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TicketAsignacionHistorico } from './ticket-asignacion-historico.entity';

@Entity('tm_fast_answer')
export class FastAnswer {
    @PrimaryGeneratedColumn({ name: 'answer_id', comment: 'Primary Key' })
    id: number;

    @Column({ name: 'answer_nom', type: 'varchar', length: 255, nullable: true })
    nombre: string | null;

    @Column({ name: 'answer_descrip', type: 'varchar', length: 255, nullable: true })
    descripcion: string | null;

    @Column({ name: 'es_error_proceso', type: 'int', default: 0 })
    esErrorProceso: number;

    @Column({ name: 'fech_crea', type: 'datetime', nullable: true })
    fechaCreacion: Date | null;

    @Column({ name: 'fech_modi', type: 'datetime', nullable: true })
    fechaModificacion: Date | null;

    @Column({ name: 'fech_elim', type: 'datetime', nullable: true })
    fechaEliminacion: Date | null;

    @Column({ name: 'est', type: 'int', nullable: true })
    estado: number | null;

    @OneToMany(() => TicketAsignacionHistorico, (th) => th.errorCode)
    historiales: TicketAsignacionHistorico[];
}
