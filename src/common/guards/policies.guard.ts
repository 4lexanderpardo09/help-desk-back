import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AbilityFactory, AppAbility } from '../../modules/auth/abilities/ability.factory';
import { CHECK_POLICIES_KEY, PolicyHandler } from '../../modules/auth/decorators/check-policies.decorator';
import { JwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';

/**
 * PoliciesGuard - Guard de Autorización (MCP 17.8)
 * 
 * Evalúa las políticas definidas con @CheckPolicies antes de permitir
 * el acceso al handler del controller.
 * 
 * Flujo:
 * 1. Obtiene el usuario autenticado del request
 * 2. Construye su Ability usando AbilityFactory
 * 3. Evalúa todas las políticas definidas en el decorador
 * 4. Bloquea si alguna política falla
 * 
 * @example
 * @UseGuards(JwtAuthGuard, PoliciesGuard)
 * @CheckPolicies((ability) => ability.can('delete', 'User'))
 * @Delete(':id')
 * remove(@Param('id') id: string) { ... }
 */
@Injectable()
export class PoliciesGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private abilityFactory: AbilityFactory,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const policyHandlers =
            this.reflector.get<PolicyHandler[]>(
                CHECK_POLICIES_KEY,
                context.getHandler(),
            ) || [];

        // Si no hay políticas definidas, permitir acceso (solo JWT)
        if (policyHandlers.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user as JwtPayload;

        if (!user) {
            return false;
        }

        // Ahora es async (carga permisos desde caché/BD)
        const ability = await this.abilityFactory.createForUser(user);

        // Todas las políticas deben pasar (AND lógico)
        return policyHandlers.every((handler) =>
            this.execPolicyHandler(handler, ability),
        );
    }

    private execPolicyHandler(handler: PolicyHandler, ability: AppAbility): boolean {
        if (typeof handler === 'function') {
            return handler(ability);
        }
        return handler.handle(ability);
    }
}
