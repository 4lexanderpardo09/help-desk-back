import { Subcategoria } from 'src/modules/subcategories/entities/subcategoria.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tm_regla_mapeo')
export class ReglaMapeo {
    @PrimaryGeneratedColumn({ name: 'regla_id' })
    id: number;

    @Column({ name: 'cats_id', type: 'int', comment: 'ID de la subcategoría a la que aplica la regla' })
    subcategoriaId: number;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;

    @ManyToOne(() => Subcategoria, (s) => s.reglaMapeo)
    @JoinColumn({name: 'cats_id'})
    subcategoria: Subcategoria[];
}
