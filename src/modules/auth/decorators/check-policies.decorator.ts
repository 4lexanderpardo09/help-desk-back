import { SetMetadata } from '@nestjs/common';
import { AppAbility } from '../abilities/ability.factory';

/**
 * Interfaz para definir manejadores de políticas complejos (basados en Clases).
 * * Útil cuando la validación requiere inyección de dependencias o lógica reutilizable extensa.
 */
export interface IPolicyHandler {
    /**
     * Método que contiene la lógica de validación.
     * @param ability La instancia de habilidades (CASL) del usuario actual.
     * @returns true si cumple la política, false si no.
     */
    handle(ability: AppAbility): boolean;
}

/**
 * Tipo para manejadores de políticas simples (basados en Funciones).
 * * Ideal para validaciones rápidas definidas inline en el controlador.
 */
type PolicyHandlerCallback = (ability: AppAbility) => boolean;

/**
 * Un manejador de políticas puede ser una función callback o una clase que implemente IPolicyHandler.
 */
export type PolicyHandler = IPolicyHandler | PolicyHandlerCallback;

/**
 * Clave de metadatos utilizada para almacenar los handlers de políticas.
 * El `PoliciesGuard` leerá esta clave para ejecutar las validaciones.
 */
export const CHECK_POLICIES_KEY = 'check_policy';

/**
 * Decorador para aplicar políticas de autorización CASL a un endpoint o controlador.
 * * Permite definir una o varias reglas que deben cumplirse para acceder al recurso.
 * Las políticas se evalúan en secuencia (AND lógico) dentro del `PoliciesGuard`.
 * * @param handlers Lista de funciones o clases que validan una habilidad específica.
 * * @example
 * // 1. Uso básico (Función Inline): Solo permitir si puede leer usuarios
 * @CheckPolicies((ability) => ability.can('read', 'User'))
 * * @example
 * // 2. Uso múltiple (AND): Debe poder leer Usuarios Y Departamentos
 * @CheckPolicies(
 * (ability) => ability.can('read', 'User'),
 * (ability) => ability.can('read', 'Department')
 * )
 * * @example
 * // 3. Uso con Clases (para lógica compleja reutilizable)
 * @CheckPolicies(new ReadUserPolicyHandler())
 */
export const CheckPolicies = (...handlers: PolicyHandler[]) =>
    SetMetadata(CHECK_POLICIES_KEY, handlers);