import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Subcategoria } from '../../subcategories/entities/subcategoria.entity';
import { PasoFlujo } from './paso-flujo.entity';
import { DocumentoFlujo } from '../../documents/entities/documento-flujo.entity';
import { FlujoPlantilla } from './flujo-plantilla.entity';
import { Ruta } from './ruta.entity';
import { DataExcel } from '../../imports/entities/data-excel.entity';

@Entity('tm_flujo')
export class Flujo {
    @PrimaryGeneratedColumn({ name: 'flujo_id' })
    id: number;

    @Column({ name: 'flujo_nom', type: 'varchar', length: 200, nullable: true })
    nombre: string | null;

    @Column({ name: 'cats_id', type: 'int', unique: true })
    subcategoriaId: number;

    @Column({
        name: 'usu_id_observador',
        type: 'text',
        nullable: true,
        comment: 'IDs de usuarios observadores. LEGACY: Se almacena como string separado por comas "1,2,3".',
        /**
         * Transformer para manejar compatibilidad con sistema Legacy (PHP).
         * - En DB: String de IDs separados por coma ("1,2,3")
         * - En App: Array de n\u00fameros ([1, 2, 3])
         * 
         * Esto permite manipular observadores como array sin romper la estructura
         * que espera el frontend/backend anterior.
         */
        transformer: {
            to: (value: number[] | null) => value?.join(',') || null,
            from: (value: string | null) => value?.split(',').map(Number).filter((n) => !isNaN(n)) || [],
        },
    })
    usuarioObservadorIds: number[];

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;

    @Column({ name: 'flujo_nom_adjunto', type: 'varchar', length: 255, nullable: true })
    nombreAdjunto: string | null;

    @ManyToOne(() => Subcategoria)
    @JoinColumn({ name: 'cats_id' })
    subcategoria: Subcategoria;

    @OneToMany(() => PasoFlujo, (paso) => paso.flujo)
    pasos: PasoFlujo[];

    @OneToMany(() => DocumentoFlujo, (df) => df.flujo)
    documentosFlujo: DocumentoFlujo[];

    @OneToMany(() => FlujoPlantilla, (fp) => fp.flujo)
    plantillas: FlujoPlantilla[];

    @OneToMany(() => Ruta, (r) => r.flujo)
    rutas: Ruta[];

    @OneToMany(() => DataExcel, (de) => de.flujo)
    dataExcels: DataExcel[];
}
