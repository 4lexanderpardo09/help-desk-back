import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { TicketError } from '../../tickets/entities/ticket-error.entity';
import { TicketAsignacionHistorico } from '../../tickets/entities/ticket-asignacion-historico.entity';

@Entity('tm_fast_answer')
export class FastAnswer {
    @PrimaryGeneratedColumn({ name: 'answer_id' })
    id: number;

    @Column({ name: 'answer_nom', type: 'varchar', length: 255 })
    titulo: string;

    @Column({ name: 'answer_descrip', type: 'varchar', length: 255 })
    descripcion: string;

    // 1=Process Error (es_error_proceso=1), 0=Info/Other
    @Column({ name: 'es_error_proceso', type: 'int', default: 0 })
    tipo: number;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;

    @OneToMany(() => TicketError, (te) => te.answer)
    ticketErrors: TicketError[];

    @OneToMany(() => TicketAsignacionHistorico, (th) => th.errorCode)
    historiales: TicketAsignacionHistorico[];
}
