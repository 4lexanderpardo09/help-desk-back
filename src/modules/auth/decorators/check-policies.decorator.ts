import { SetMetadata } from '@nestjs/common';
import { AppAbility } from '../abilities/ability.factory';

/**
 * Interface para definir handlers de políticas
 * 
 * Un PolicyHandler puede ser:
 * - Una función que recibe ability y retorna boolean
 * - Una clase que implementa IPolicyHandler
 */
export interface IPolicyHandler {
    handle(ability: AppAbility): boolean;
}

type PolicyHandlerCallback = (ability: AppAbility) => boolean;

export type PolicyHandler = IPolicyHandler | PolicyHandlerCallback;

export const CHECK_POLICIES_KEY = 'check_policy';

/**
 * Decorador @CheckPolicies
 * 
 * Permite definir políticas de autorización de forma declarativa en el controller.
 * Las políticas se evalúan en el PoliciesGuard antes de ejecutar el handler.
 * 
 * @example
 * // Uso con función inline
 * @CheckPolicies((ability) => ability.can('read', 'User'))
 * @Get()
 * findAll() { ... }
 * 
 * @example
 * // Uso con múltiples políticas (AND)
 * @CheckPolicies(
 *   (ability) => ability.can('read', 'User'),
 *   (ability) => ability.can('read', 'Department')
 * )
 */
export const CheckPolicies = (...handlers: PolicyHandler[]) =>
    SetMetadata(CHECK_POLICIES_KEY, handlers);
