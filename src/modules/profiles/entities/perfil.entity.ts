import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tm_perfil')
export class Perfil {
    @PrimaryGeneratedColumn({ name: 'per_id' })
    id: number;

    @Column({ name: 'per_nom', type: 'varchar', length: 150 })
    nombre: string;

    @Column({ name: 'fech_crea', type: 'datetime', nullable: true })
    fechaCreacion: Date | null;

    @Column({ name: 'fech_modi', type: 'datetime', nullable: true })
    fechaModificacion: Date | null;

    @Column({ name: 'fech_elim', type: 'datetime', nullable: true })
    fechaEliminacion: Date | null;

    @Column({ name: 'est', type: 'int' })
    estado: number;

    // TODO: Agregar relaciones OneToMany
    // @OneToMany(() => User, (user) => user.perfil)
    // usuarios: User[];
}
