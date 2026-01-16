import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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

    // TODO: Agregar relaciones
    // @ManyToOne(() => Regla)
    // @JoinColumn({ name: 'regla_id' })
    // regla: Regla;
}
