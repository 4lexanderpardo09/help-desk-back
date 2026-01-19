import { Ability, AbilityBuilder, AbilityClass } from '@casl/ability';
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { PermissionsService, CachedPermission } from '../../permissions/permissions.service';

/**
 * Acciones estándar del sistema (convención MCP punto 17.4)
 * 
 * - manage: implica todas las acciones
 * - create, read, update, delete: operaciones CRUD estándar
 */
export type Actions = 'manage' | 'create' | 'read' | 'update' | 'delete';

/**
 * Subjects (recursos) del sistema
 * Corresponden a entidades del dominio, no a rutas HTTP.
 * Ahora incluye 'Permission' para gestionar permisos dinámicos.
 */
export type Subjects =
    | 'User'
    | 'Ticket'
    | 'Category'
    | 'Subcategoria'
    | 'Department'
    | 'Role'
    | 'Profile'
    | 'Regional'
    | 'Company'
    | 'Permission'
    | 'Zone'
    | 'Priority'
    | 'Position'
    | 'Rule'
    | 'Report'
    | 'all';

export type AppAbility = Ability<[Actions, Subjects]>;

/**
 * AbilityFactory - Permisos dinámicos desde Base de Datos
 * 
 * Los permisos se cargan desde `tm_rol_permiso` a través de `PermissionsService`,
 * que mantiene un caché en memoria para rendimiento.
 * 
 * @example
 * const ability = await abilityFactory.createForUser(jwtPayload);
 * ability.can('read', 'Ticket'); // true/false basado en BD
 */
@Injectable()
export class AbilityFactory {
    constructor(
        @Inject(forwardRef(() => PermissionsService))
        private readonly permissionsService: PermissionsService,
    ) { }

    /**
     * Crea una instancia de Ability para el usuario autenticado.
     * Carga permisos dinámicamente desde el caché (respaldado por BD).
     * 
     * @param user - Payload del JWT con información del usuario
     * @returns Promise<AppAbility> - Instancia de Ability con reglas del rol
     */
    async createForUser(user: JwtPayload): Promise<AppAbility> {
        const { can, build } = new AbilityBuilder<AppAbility>(
            Ability as AbilityClass<AppAbility>,
        );

        // Si no hay rol, permisos mínimos
        if (!user.rol_id) {
            return build({
                detectSubjectType: (subject) => subject as Subjects,
            });
        }

        // Cargar permisos desde caché/BD
        const permissions = await this.permissionsService.getPermissionsForRole(user.rol_id);

        // Aplicar cada permiso
        for (const permission of permissions) {
            can(
                permission.action as Actions,
                permission.subject as Subjects,
            );
        }

        return build({
            detectSubjectType: (subject) => subject as Subjects,
        });
    }
}
