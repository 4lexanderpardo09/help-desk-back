import { Ability, AbilityBuilder, AbilityClass, ExtractSubjectType, InferSubjects } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

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
 */
export type Subjects =
    | 'User'
    | 'Ticket'
    | 'Category'
    | 'Department'
    | 'Role'
    | 'Profile'
    | 'Regional'
    | 'Company'
    | 'all';

export type AppAbility = Ability<[Actions, Subjects]>;

/**
 * AbilityFactory - Punto central de definición de permisos (MCP 17.6)
 * 
 * Construye las "abilities" (habilidades) de un usuario basándose en su rol.
 * El JWT solo identifica al usuario; los permisos se calculan aquí en runtime.
 * 
 * @example
 * const ability = abilityFactory.createForUser(jwtPayload);
 * ability.can('read', 'Ticket'); // true/false
 */
@Injectable()
export class AbilityFactory {
    /**
     * Crea una instancia de Ability para el usuario autenticado.
     * 
     * @param user - Payload del JWT con información del usuario
     * @returns AppAbility - Instancia de Ability con reglas aplicadas
     */
    createForUser(user: JwtPayload): AppAbility {
        const { can, cannot, build } = new AbilityBuilder<AppAbility>(
            Ability as AbilityClass<AppAbility>,
        );

        /**
         * Reglas basadas en rol
         * 
         * Roles conocidos del sistema legacy:
         * - 1: Admin (manage all)
         * - 2: Agente
         * - 3: Cliente
         * - 4: Supervisor
         */
        switch (user.rol_id) {
            case 1: // Admin
                can('manage', 'all');
                break;

            case 4: // Supervisor
                can('read', 'all');
                can('update', 'Ticket');
                can('update', 'User');
                cannot('delete', 'User');
                break;

            case 2: // Agente
                can('read', 'Ticket');
                can('update', 'Ticket');
                can('read', 'User');
                can('read', 'Category');
                can('read', 'Department');
                break;

            case 3: // Cliente
                can('read', 'Ticket');
                can('create', 'Ticket');
                can('read', 'Category');
                break;

            default:
                // Usuario sin rol definido: solo lectura básica
                can('read', 'Ticket');
                break;
        }

        return build({
            detectSubjectType: (subject) => subject as Subjects,
        });
    }
}
