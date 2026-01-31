import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * Decorador personalizado para extraer el usuario autenticado de la petición.
 * * Este decorador asume que el `JwtAuthGuard` ya ha validado el token
 * e inyectado el payload en `request.user`.
 * * @param data (Opcional) Nombre de una propiedad específica del payload (ej. 'usu_id').
 * @param ctx Contexto de ejecución de NestJS.
 * * @example
 * // 1. Obtener el objeto completo
 * getProfile(@User() user: JwtPayload)
 * * @example
 * // 2. Obtener solo el ID (con autocompletado gracias a keyof)
 * update(@User('usu_id') userId: number)
 */
export const User = createParamDecorator(
    (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
        // Cambiar al contexto HTTP para acceder al objeto Request estándar
        const request = ctx.switchToHttp().getRequest();
        
        // Recuperar el usuario inyectado por la estrategia Passport-JWT
        const user = request.user as JwtPayload;

        // Si se solicita una propiedad específica, devolver solo ese valor
        return data ? user?.[data] : user;
    },
);