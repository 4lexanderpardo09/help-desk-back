import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Flujo } from './flujo.entity';
import { Empresa } from '../../companies/entities/empresa.entity';

@Entity('tm_flujo_plantilla')
export class FlujoPlantilla {
    @PrimaryGeneratedColumn({ name: 'flujo_plantilla_id' })
    id: number;

    @Column({ name: 'flujo_id', type: 'int' })
    flujoId: number;

    @Column({ name: 'emp_id', type: 'int' })
    empresaId: number;

    @Column({ name: 'plantilla_nom', type: 'varchar', length: 255 })
    nombrePlantilla: string;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;

    @ManyToOne(() => Flujo, (f) => f.plantillas)
    @JoinColumn({ name: 'flujo_id' })
    flujo: Flujo;

    @ManyToOne(() => Empresa, (e) => e.flujosPlantilla)
    @JoinColumn({ name: 'emp_id' })
    empresa: Empresa;
}
