import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TicketError } from '../../tickets/entities/ticket-error.entity';
import { TicketAsignacionHistorico } from '../../tickets/entities/ticket-asignacion-historico.entity';
import { ErrorSubtype } from './error-subtype.entity';

export enum ErrorTypeCategory {
    INFO = 0,
    PROCESS_ERROR = 1,
}

@Entity('tm_error_type')
export class ErrorType {
    @PrimaryGeneratedColumn({ name: 'error_type_id' })
    id: number;

    @Column({ name: 'title', type: 'varchar', length: 255 })
    title: string;

    @Column({ name: 'description', type: 'varchar', length: 255, nullable: true })
    description: string;

    // 1=Process Error (Returns ticket), 0=Info
    @Column({ name: 'is_process_error', type: 'tinyint', default: ErrorTypeCategory.INFO })
    category: ErrorTypeCategory;

    @Column({ name: 'est', type: 'tinyint', default: 1 })
    isActive: boolean;

    // Subtypes Relation (Master-Detail)
    @OneToMany(() => ErrorSubtype, (subtype) => subtype.errorType)
    subtypes: ErrorSubtype[];

    @OneToMany(() => TicketError, (te) => te.errorType)
    ticketErrors: TicketError[];

    @OneToMany(() => TicketAsignacionHistorico, (th) => th.errorCode)
    historiales: TicketAsignacionHistorico[];
}
