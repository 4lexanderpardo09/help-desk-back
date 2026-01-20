import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Permission } from './permission.entity';
import { Role } from '../../roles/entities/role.entity';

/**
 * Entidad RolePermission - Tabla pivote Rol-Permiso
 * 
 * Asigna permisos específicos a roles.
 * Esta tabla define qué puede hacer cada rol en el sistema.
 */
@Entity('tm_rol_permiso')
export class RolePermission {
    @PrimaryGeneratedColumn({ name: 'rp_id' })
    id: number;

    @Column({ name: 'rol_id' })
    rolId: number;

    @Column({ name: 'perm_id' })
    permisoId: number;

    @Column({ name: 'est', type: 'tinyint', default: 1 })
    estado: number;

    @Column({ name: 'fech_cre', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    fechaCreacion: Date;

    // Relaciones
    @ManyToOne(() => Role, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'rol_id' })
    role: Role;

    @ManyToOne(() => Permission, (p) => p.rolePermissions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'perm_id' })
    permission: Permission;
}
