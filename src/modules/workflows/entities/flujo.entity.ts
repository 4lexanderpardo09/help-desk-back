import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, ManyToMany, JoinTable } from 'typeorm';
import { User } from '../../users/entities/user.entity';
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

    @ManyToMany(() => User, (user) => user.flujosObservados)
    @JoinTable({
        name: 'flujo_usuario', // Nombre tabla pivot
        joinColumn: {
            name: 'flujo_id',
            referencedColumnName: 'id',
        },
        inverseJoinColumn: {
            name: 'usu_id',
            referencedColumnName: 'id',
        },
    })
    usuariosObservadores: User[];

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;

    @Column({ name: 'flujo_nom_adjunto', type: 'varchar', length: 255, nullable: true })
    nombreAdjunto: string | null;

    @ManyToOne(() => Subcategoria, (s) => s.flujo)
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
