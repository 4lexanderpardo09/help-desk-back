import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tm_data_excel')
export class DataExcel {
    @PrimaryGeneratedColumn({ name: 'data_id' })
    id: number;

    @Column({ name: 'flujo_id', type: 'int', nullable: true, comment: 'ID del flujo al que pertenece este dataset' })
    flujoId: number | null;

    @Column({ name: 'nombre_archivo', type: 'varchar', length: 255 })
    nombreArchivo: string;

    @Column({ name: 'datos_json', type: 'longtext', comment: 'Contenido del excel en formato JSON' })
    datosJson: string;

    @Column({ name: 'fech_carga', type: 'datetime' })
    fechaCarga: Date;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;

    // TODO: Agregar relaciones ManyToOne
    // @ManyToOne(() => Flujo)
    // @JoinColumn({ name: 'flujo_id' })
    // flujo: Flujo;
}
