import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
}
