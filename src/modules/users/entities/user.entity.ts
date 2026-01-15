import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tm_usuario')
export class User {
    @PrimaryGeneratedColumn({ name: 'usu_id' })
    id: number;

    @Column({ name: 'usu_cedula', type: 'varchar', length: 20, nullable: true })
    cedula: string | null;

    @Column({ name: 'usu_nom', type: 'varchar', length: 150, nullable: true })
    nombre: string | null;

    @Column({ name: 'usu_ape', type: 'varchar', length: 150, nullable: true })
    apellido: string | null;

    @Column({ name: 'usu_correo', type: 'varchar', length: 150 })
    email: string;

    @Column({ name: 'usu_pass', type: 'varchar', length: 150, select: false })
    password: string;

    @Column({
        name: 'usu_token_recuperacion',
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    tokenRecuperacion: string | null;

    @Column({ name: 'usu_token_expiracion', type: 'datetime', nullable: true })
    tokenExpiracion: Date | null;

    @Column({ name: 'rol_id', type: 'int', nullable: true })
    rolId: number | null;

    @Column({ name: 'reg_id', type: 'int', nullable: true })
    regionalId: number | null;

    @Column({ name: 'car_id', type: 'int', nullable: true })
    cargoId: number | null;

    @Column({ name: 'dp_id', type: 'int', nullable: true })
    departamentoId: number | null;

    @Column({ name: 'es_nacional', type: 'tinyint', default: 0 })
    esNacional: boolean;

    @Column({ name: 'fech_crea', type: 'datetime', nullable: true })
    fechaCreacion: Date | null;

    @Column({ name: 'fech_modi', type: 'datetime', nullable: true })
    fechaModificacion: Date | null;

    @Column({ name: 'fech_elim', type: 'datetime', nullable: true })
    fechaEliminacion: Date | null;

    @Column({ name: 'est', type: 'int' })
    estado: number;

    @Column({ name: 'usu_firma', type: 'varchar', length: 255, nullable: true })
    firma: string | null;

    /**
     * Nombre completo del usuario
     */
    get nombreCompleto(): string {
        return `${this.nombre || ''} ${this.apellido || ''}`.trim();
    }
}
