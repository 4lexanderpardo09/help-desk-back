import { Ability, AbilityBuilder, AbilityClass, ExtractSubjectType } from '@casl/ability';
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { PermissionsService } from '../../permissions/permissions.service';

/**
 * Catálogo de Acciones permitidas en el sistema (Verbos).
 * * Basado en la convención MCP 17.4 y CRUD estándar.
 * * - **manage**: "Comodín" que otorga acceso total.
 * * - **view:...**: Acciones personalizadas para reglas de negocio específicas (ej. ver solo mis tickets).
 */
export type Actions =
    | 'manage'          // Acceso total
    | 'create'          // Crear
    | 'read'            // Leer/Ver detalles
    | 'update'          // Editar
    | 'delete'          // Eliminar
    | 'view:assigned'   // Ver tickets asignados a mí
    | 'view:created'    // Ver tickets creados por mí
    | 'view:all'        // Ver todos los tickets (Supervisores)
    | 'view:observed';  // Ver tickets donde soy observador

/**
 * Catálogo de Sujetos o Recursos del sistema (Sustantivos).
 * * Representan las entidades de negocio sobre las cuales se ejercen las acciones.
 * * Nota: 'all' es una palabra clave de CASL para referirse a "cualquier recurso".
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
    | 'Permission' // Permite gestionar los permisos de otros
    | 'Zone'
    | 'Priority'
    | 'Position'
    | 'Rule'
    | 'Report'
    | 'Organigrama'
    | 'Workflow'
    | 'Template'
    | 'Migration'
    | 'all'; // Comodín para "Todo el sistema"

/**
 * Tipo de dato que define la "Habilidad" específica de nuestra aplicación.
 * Combina nuestras Acciones y Sujetos definidos arriba.
 */
export type AppAbility = Ability<[Actions, Subjects]>;

/**
 * Fábrica de Habilidades (Ability Factory).
 * * Responsable de transformar los datos crudos de permisos (desde BD/Caché)
 * en reglas lógicas ejecutables por la librería CASL.
 */
@Injectable()
export class AbilityFactory {
    constructor(
        // Usamos forwardRef para evitar referencias circulares, ya que PermissionsModule
        // podría depender de AuthModule en algún punto.
        @Inject(forwardRef(() => PermissionsService))
        private readonly permissionsService: PermissionsService,
    ) { }

    /**
     * Construye dinámicamente el objeto `Ability` para un usuario autenticado.
     * * * Flujo:
     * 1. Verifica si el usuario tiene un Rol asignado.
     * 2. Consulta al `PermissionsService` para obtener la lista de reglas (acciones/sujetos) de ese Rol.
     * 3. Itera sobre la lista y registra cada regla mediante `can()`.
     * * @param user Payload del token JWT con el ID del rol (`rol_id`).
     * @returns Una promesa con la instancia de `AppAbility` lista para ser usada en los Guards.
     */
    async createForUser(user: JwtPayload): Promise<AppAbility> {
        // AbilityBuilder nos ayuda a definir reglas de forma legible (can, cannot)
        const { can, build } = new AbilityBuilder<AppAbility>(
            Ability as AbilityClass<AppAbility>,
        );

        // Caso base: Usuario sin rol (o rol nulo).
        // Se retorna una habilidad vacía (no puede hacer nada).
        if (!user.rol_id) {
            return build({
                // Configuración necesaria para que CASL entienda strings como sujetos
                detectSubjectType: (subject) => subject as Subjects,
            });
        }

        // Recuperar permisos dinámicos (Optimizados con caché en el servicio)
        const permissions = await this.permissionsService.getPermissionsForRole(user.rol_id);

        // Mapeo DB -> CASL
        // Convertimos cada fila de la tabla de permisos en una regla en memoria.
        for (const permission of permissions) {
            can(
                permission.action as Actions,
                permission.subject as Subjects,
            );
        }

        // Construir y retornar la instancia final
        return build({
            // Esta función le dice a CASL cómo identificar el tipo de objeto.
            // Al usar strings simples ('User', 'Ticket'), basta con castearlo.
            detectSubjectType: (subject) => subject as Subjects,
        });
    }
}