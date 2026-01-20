import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * @deprecated Legacy Entity for Migration Analysis
 * Mapeo exacto de la tabla `tm_usuario`.
 */
@Entity('tm_usuario')
export class UsuarioLegacy {
    @PrimaryGeneratedColumn({ name: 'usu_id' })
    id: number;

    @Column({ name: 'usu_nom', type: 'varchar', length: 150 })
    nombre: string;

    @Column({ name: 'usu_ape', type: 'varchar', length: 150 })
    apellido: string;

    @Column({ name: 'usu_correo', type: 'varchar', length: 150 })
    email: string;

    /** Password hasheado (BCRYPT) */
    @Column({ name: 'usu_pass', type: 'varchar', length: 255 })
    password: string;

    @Column({ name: 'rol_id', type: 'int' })
    rolId: number;

    /** Puede ser NULL si es usuario nacional o admin global */
    @Column({ name: 'reg_id', type: 'int', nullable: true })
    regionalId: number | null;

    @Column({ name: 'car_id', type: 'int', nullable: true })
    cargoId: number | null;

    @Column({ name: 'dp_id', type: 'int', nullable: true })
    departamentoId: number | null;

    /** 1 = Es usuario nacional (ve todo lo de su cargo a nivel país) */
    @Column({ name: 'es_nacional', type: 'boolean', default: false })
    esNacional: boolean;

    @Column({ name: 'usu_cedula', type: 'varchar', length: 20, nullable: true })
    cedula: string | null;

    @Column({ name: 'usu_telefono', type: 'varchar', length: 20, nullable: true })
    telefono: string | null;

    @Column({ name: 'usu_firma', type: 'text', nullable: true })
    firma: string | null;

    @Column({ name: 'usu_token_recuperacion', type: 'varchar', length: 255, nullable: true })
    tokenRecuperacion: string | null;

    @Column({ name: 'usu_token_expiracion', type: 'datetime', nullable: true })
    tokenExpiracion: Date | null;

    @Column({ name: 'fech_crea', type: 'datetime', nullable: true })
    fechaCreacion: Date | null;

    @Column({ name: 'fech_modi', type: 'datetime', nullable: true })
    fechaModificacion: Date | null;

    @Column({ name: 'fech_elim', type: 'datetime', nullable: true })
    fechaEliminacion: Date | null;

    @Column({ name: 'est', type: 'int', default: 1 })
    estado: number;
}
