import { Subcategoria } from 'src/modules/subcategories/entities/subcategoria.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ReglaCreadoresPerfil } from './regla-creadores-perfil.entity';
import { ReglaAsignados } from './regla-asignados.entity';
import { ReglaCreadores } from './regla-creadores.entity';

@Entity('tm_regla_mapeo')
export class ReglaMapeo {
    @PrimaryGeneratedColumn({ name: 'regla_id' })
    id: number;

    @Column({ name: 'cats_id', type: 'int', comment: 'ID de la subcategoría a la que aplica la regla' })
    subcategoriaId: number;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;

    @ManyToOne(() => Subcategoria, (s) => s.reglaMapeo)
    @JoinColumn({ name: 'cats_id' })
    subcategoria: Subcategoria;

    @OneToMany(() => ReglaCreadoresPerfil, (rcp) => rcp.regla)
    creadoresPerfil: ReglaCreadoresPerfil[];

    @OneToMany(() => ReglaAsignados, (ra) => ra.regla)
    asignados: ReglaAsignados[];

    @OneToMany(() => ReglaCreadores, (rc) => rc.regla)
    creadores: ReglaCreadores[];
}
