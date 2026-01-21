import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { TicketError } from '../../tickets/entities/ticket-error.entity';
import { TicketAsignacionHistorico } from '../../tickets/entities/ticket-asignacion-historico.entity';

@Entity('tm_fast_answer')
export class FastAnswer {
    @PrimaryGeneratedColumn({ name: 'ans_id' })
    id: number;

    @Column({ name: 'ans_title', type: 'varchar', length: 150 })
    titulo: string;

    @Column({ name: 'ans_descrip', type: 'text' })
    descripcion: string;

    // 1=Process Error, 2=Info Error, etc.
    @Column({ name: 'ans_type', type: 'int', default: 1 })
    tipo: number;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;

    @OneToMany(() => TicketError, (te) => te.answer)
    ticketErrors: TicketError[];

    @OneToMany(() => TicketAsignacionHistorico, (th) => th.errorCode)
    historiales: TicketAsignacionHistorico[];
}
