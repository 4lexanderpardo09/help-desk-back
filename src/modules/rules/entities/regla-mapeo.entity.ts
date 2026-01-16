import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ReglaAsignados } from './regla-asignados.entity';
import { ReglaCreadores } from './regla-creadores.entity';
import { ReglaCreadoresPerfil } from './regla-creadores-perfil.entity';

@Entity('tm_regla_mapeo')
export class ReglaMapeo {
    @PrimaryGeneratedColumn({ name: 'regla_id' })
    id: number;

    @Column({ name: 'cats_id', type: 'int', comment: 'ID de la subcategoría a la que aplica la regla' })
    subcategoriaId: number;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;

    // Relaciones inversas (Ya que tenemos las otras entidades creadas en este mismo módulo)

    // @OneToMany(() => ReglaAsignados, (ra) => ra.regla)
    // asignados: ReglaAsignados[];

    // @OneToMany(() => ReglaCreadores, (rc) => rc.regla)
    // creadores: ReglaCreadores[];

    // @OneToMany(() => ReglaCreadoresPerfil, (rcp) => rcp.regla)
    // creadoresPerfil: ReglaCreadoresPerfil[];
}
