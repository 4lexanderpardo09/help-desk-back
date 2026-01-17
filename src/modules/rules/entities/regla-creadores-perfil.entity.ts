import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ReglaMapeo } from './regla-mapeo.entity';
import { Perfil } from '../../profiles/entities/perfil.entity';

@Entity('regla_creadores_perfil')
export class ReglaCreadoresPerfil {
    @PrimaryGeneratedColumn({ name: 'rcp_id' })
    id: number;

    @Column({ name: 'regla_id', type: 'int' })
    reglaId: number;

    @Column({ name: 'creator_per_id', type: 'int' })
    creadorPerfilId: number;

    @Column({ name: 'fech_crea', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    fechaCreacion: Date;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;

    @ManyToOne(() => ReglaMapeo, (rm) => rm.creadoresPerfil)
    @JoinColumn({ name: 'regla_id' })
    regla: ReglaMapeo;

    @ManyToOne(() => Perfil, (p) => p.reglasCreadoresPerfil)
    @JoinColumn({ name: 'creator_per_id' })
    perfil: Perfil;
}
