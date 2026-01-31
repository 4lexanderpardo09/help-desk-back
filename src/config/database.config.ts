import { registerAs } from '@nestjs/config';

/**
 * Configuración del módulo de Base de Datos.
 * * Define el namespace 'database' para agrupar las credenciales de conexión.
 * * Permite acceder a los valores de forma tipada y segura.
 * * @example
 * // Uso en un servicio:
 * const dbHost = configService.get<string>('database.host');
 */
export default registerAs('database', () => ({
    /** Host del servidor de base de datos (ej. localhost o IP). */
    host: process.env.DB_HOST || 'localhost',

    /** Puerto de conexión (convertido a entero). Default MySQL: 3306. */
    port: parseInt(process.env.DB_PORT || '3306', 10),

    /** Usuario de la base de datos. */
    username: process.env.DB_USERNAME || 'root',

    /** Contraseña del usuario. Default: vacía (común en entornos locales como XAMPP). */
    password: process.env.DB_PASSWORD || '',

    /** Nombre del esquema o base de datos a conectar. */
    database: process.env.DB_DATABASE || 'help_desk',
}));