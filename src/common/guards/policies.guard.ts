import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AbilityFactory, AppAbility } from '../../modules/auth/abilities/ability.factory';
import { CHECK_POLICIES_KEY, PolicyHandler } from '../../modules/auth/decorators/check-policies.decorator';
import { JwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';

/**
 * Guard de Políticas (Authorization Guard).
 * * Este guard actúa como el "enforcer" de CASL en NestJS.
 * Intercepta la petición, construye las habilidades (abilities) del usuario 
 * basándose en sus permisos y verifica si cumple con las políticas definidas en el controlador.
 * * * Requisito: Debe usarse DESPUÉS de `JwtAuthGuard`, ya que necesita `request.user`.
 */
@Injectable()
export class PoliciesGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private abilityFactory: AbilityFactory,
    ) { }

    /**
     * Método principal de validación.
     * 1. Lee los metadatos (@CheckPolicies) del controlador/método.
     * 2. Si no hay políticas, permite el acceso.
     * 3. Recupera el usuario del request (inyectado previamente por Passport).
     * 4. Construye la instancia de Ability (Permisos) para ese usuario.
     * 5. Ejecuta todas las políticas y retorna true solo si TODAS se cumplen.
     */
    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Leer handlers de políticas definidos con @CheckPolicies
        const policyHandlers =
            this.reflector.get<PolicyHandler[]>(
                CHECK_POLICIES_KEY,
                context.getHandler(),
            ) || [];

        // Optimización: Si la ruta no tiene políticas específicas, permitir acceso
        // (Asumimos que la autenticación básica JWT es suficiente o se maneja aparte)
        if (policyHandlers.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user as JwtPayload;

        // Fail-safe: Si no hay usuario (JwtAuthGuard falló o no se usó), denegar.
        if (!user) {
            return false;
        }

        // Construcción de Habilidades (Async):
        // Esto puede implicar consultas a BD o Caché para traer los permisos del Rol.
        const ability = await this.abilityFactory.createForUser(user);

        // Inyección de Dependencia en Request:
        // Guardamos la 'ability' en el request para que los controladores 
        // puedan usarla manualmente si necesitan validaciones condicionales extra.
        // Nota: Asegúrate de extender la interfaz Request de Express si usas TypeScript estricto.
        request.ability = ability;

        // Validación Estricta (AND): El usuario debe cumplir TODAS las políticas.
        return policyHandlers.every((handler) =>
            this.execPolicyHandler(handler, ability),
        );
    }

    /**
     * Helper para ejecutar un handler de política.
     * Normaliza la ejecución ya sea que el handler sea una función simple o una clase.
     * @param handler La función o clase que contiene la lógica de validación.
     * @param ability La instancia de habilidades del usuario.
     */
    private execPolicyHandler(handler: PolicyHandler, ability: AppAbility): boolean {
        if (typeof handler === 'function') {
            return handler(ability);
        }
        return handler.handle(ability);
    }
}