import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ReglaAsignados } from 'src/modules/rules/entities/regla-asignados.entity';
import { ReglaCreadores } from 'src/modules/rules/entities/regla-creadores.entity';
import { Organigrama } from './organigrama.entity';
import { PasoFlujoFirma } from '../../workflows/entities/paso-flujo-firma.entity';
import { PasoFlujoUsuario } from '../../workflows/entities/paso-flujo-usuario.entity';

@Entity('tm_cargo')
export class Cargo {
    @PrimaryGeneratedColumn({ name: 'car_id' })
    id: number;

    @Column({ name: 'car_nom', type: 'varchar', length: 150 })
    nombre: string;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;

    @OneToMany(() => User, (user) => user.cargo)
    usuarios: User[];

    @OneToMany(() => ReglaAsignados, (ra) => ra.cargo)
    reglasAsignados: ReglaAsignados[];

    @OneToMany(() => ReglaCreadores, (rc) => rc.cargo)
    reglasCreadores: ReglaCreadores[];

    @OneToMany(() => Organigrama, (o) => o.cargo)
    organigrama: Organigrama[];

    @OneToMany(() => Organigrama, (o) => o.jefeCargo)
    organigramaJefe: Organigrama[];

    @OneToMany(() => PasoFlujoFirma, (pff) => pff.cargo)
    firmasFlujo: PasoFlujoFirma[];

    @OneToMany(() => PasoFlujoUsuario, (pfu) => pfu.cargo)
    usuariosFlujo: PasoFlujoUsuario[];
}
