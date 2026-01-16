import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tm_flujo')
export class Flujo {
    @PrimaryGeneratedColumn({ name: 'flujo_id' })
    id: number;

    @Column({ name: 'flujo_nom', type: 'varchar', length: 200, nullable: true })
    nombre: string | null;

    @Column({ name: 'cats_id', type: 'int', unique: true })
    subcategoriaId: number;

    @Column({ name: 'usu_id_observador', type: 'text', nullable: true, comment: 'IDs de usuarios observadores' })
    usuarioObservadorIds: string | null;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;

    @Column({ name: 'flujo_nom_adjunto', type: 'varchar', length: 255, nullable: true })
    nombreAdjunto: string | null;

    // TODO: Agregar relaciones ManyToOne / OneToMany
    // @OneToOne(() => Subcategoria)
    // @JoinColumn({ name: 'cats_id' })
    // subcategoria: Subcategoria;

    // @OneToMany(() => PasoFlujo, (paso) => paso.flujo)
    // pasos: PasoFlujo[];

    // @OneToMany(() => DataExcel, (data) => data.flujo)
    // datasExcel: DataExcel[];
}
