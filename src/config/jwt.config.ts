import { registerAs } from '@nestjs/config';

/**
 * Configuración del módulo JWT (JSON Web Tokens).
 * * Define el namespace 'jwt' para agrupar las claves de seguridad.
 * * @example
 * // Uso: configService.get<string>('jwt.secret')
 */
export default registerAs('jwt', () => ({
    /** * Clave secreta para firmar los tokens.
     * ! IMPORTANTE: En producción, esta variable debe ser compleja y única.
     * Si no se define en .env, usa un valor inseguro por defecto (solo para desarrollo).
     */
    secret: process.env.JWT_SECRET || 'default-secret-change-me',

    /** * Tiempo de expiración del token.
     * Formatos aceptados:
     * - Segundos (numérico): 3600
     * - Cadena de tiempo: '1h', '24h', '7d'
     */
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
}));