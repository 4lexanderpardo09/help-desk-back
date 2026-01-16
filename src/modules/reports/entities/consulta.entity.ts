import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tm_consulta')
export class Consulta {
    @PrimaryGeneratedColumn({ name: 'cons_id' })
    id: number;

    @Column({ name: 'cons_nom', type: 'varchar', length: 150 })
    nombre: string;

    @Column({ name: 'cons_sql', type: 'text' })
    sql: string;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;

    @Column({ name: 'fech_crea', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    fechaCreacion: Date;
}
