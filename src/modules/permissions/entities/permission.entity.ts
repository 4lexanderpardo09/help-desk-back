import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { RolePermission } from './role-permission.entity';

/**
 * Entidad Permission - Catálogo de permisos del sistema
 * 
 * Define las acciones disponibles por recurso (subject).
 * Los permisos se asignan a roles mediante tm_rol_permiso.
 * 
 * @example
 * { action: 'read', subject: 'User', descripcion: 'Ver usuarios' }
 */
@Entity('tm_permiso')
export class Permission {
    @PrimaryGeneratedColumn({ name: 'perm_id' })
    id: number;

    /**
     * Nombre descriptivo del permiso (ej: "Ver Usuarios")
     */
    @Column({ name: 'perm_nom', type: 'varchar', length: 100 })
    nombre: string;

    /**
     * Acción del permiso
     * Valores válidos: read, create, update, delete, manage
     */
    @Column({ name: 'perm_accion', type: 'varchar', length: 50 })
    action: string;

    /**
     * Recurso (Subject) sobre el que aplica la acción
     * Valores: User, Ticket, Category, Department, Role, etc.
     */
    @Column({ name: 'perm_subject', type: 'varchar', length: 50 })
    subject: string;

    /**
     * Descripción legible del permiso
     * @example "Ver usuarios", "Crear tickets"
     */
    @Column({ name: 'perm_desc', type: 'text', nullable: true })
    descripcion: string | null;

    @Column({ name: 'est', type: 'tinyint', default: 1 })
    estado: number;

    @Column({ name: 'fech_cre', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    fechaCreacion: Date;

    // Relación inversa con asignaciones a roles
    @OneToMany(() => RolePermission, (rp) => rp.permission)
    rolePermissions: RolePermission[];
}
