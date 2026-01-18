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
    @PrimaryGeneratedColumn({ name: 'per_id' })
    id: number;

    /**
     * Acción del permiso
     * Valores válidos: read, create, update, delete, manage
     */
    @Column({ name: 'per_action', length: 50 })
    action: string;

    /**
     * Recurso (Subject) sobre el que aplica la acción
     * Valores: User, Ticket, Category, Department, Role, etc.
     */
    @Column({ name: 'per_subject', length: 50 })
    subject: string;

    /**
     * Descripción legible del permiso
     * @example "Ver usuarios", "Crear tickets"
     */
    @Column({ name: 'per_descripcion', length: 255, nullable: true })
    descripcion: string | null;

    @Column({ name: 'est', type: 'tinyint', default: 1 })
    estado: number;

    @Column({ name: 'fech_cre', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    fechaCreacion: Date;

    // Relación inversa con asignaciones a roles
    @OneToMany(() => RolePermission, (rp) => rp.permission)
    rolePermissions: RolePermission[];
}
