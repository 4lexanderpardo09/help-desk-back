import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ErrorType } from './error-type.entity';

@Entity('tm_error_subtype')
export class ErrorSubtype {
    @PrimaryGeneratedColumn({ name: 'subtype_id' })
    id: number;

    @Column({ name: 'error_type_id', type: 'int' })
    errorTypeId: number;

    @Column({ name: 'title', type: 'varchar', length: 255 })
    title: string;

    @Column({ name: 'description', type: 'text', nullable: true })
    description: string;

    @Column({ name: 'est', type: 'tinyint', default: 1 })
    isActive: boolean;

    @ManyToOne(() => ErrorType, (et) => et.subtypes)
    @JoinColumn({ name: 'error_type_id' })
    errorType: ErrorType;
}
