import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Ruta } from './ruta.entity';
import { PasoFlujo } from './paso-flujo.entity';

@Entity('tm_ruta_paso')
export class RutaPaso {
    @PrimaryGeneratedColumn({ name: 'ruta_paso_id' })
    id: number;

    @Column({ name: 'ruta_id', type: 'int' })
    rutaId: number;

    @Column({ name: 'paso_id', type: 'int' })
    pasoId: number;

    @Column({ name: 'orden', type: 'int' })
    orden: number;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;

    @ManyToOne(() => Ruta, (r) => r.rutaPasos)
    @JoinColumn({ name: 'ruta_id' })
    ruta: Ruta;

    @ManyToOne(() => PasoFlujo, (p) => p.rutaPasos)
    @JoinColumn({ name: 'paso_id' })
    paso: PasoFlujo;
}
