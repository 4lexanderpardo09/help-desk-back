/**
 * Estructura de los datos contenidos dentro del Token JWT.
 * * Estos datos se codifican en el token y se recuperan en cada petición
 * protegida para identificar al usuario y su contexto (rol, ubicación, etc.).
 */
export interface JwtPayload {
    /** ID único del usuario en la base de datos (PK). */
    usu_id: number;

    /** Correo electrónico corporativo del usuario. */
    usu_correo: string;

    /** * ID del Rol asignado (ej. Administrador, Usuario, Consulta). 
     * Puede ser null si el usuario no tiene rol específico.
     */
    rol_id: number | null;

    /** * ID de la Regional a la que pertenece el usuario.
     * Útil para filtrar datos por zona geográfica.
     */
    reg_id: number | null;

    /** ID del Cargo que ocupa el usuario en la empresa. */
    car_id: number | null;

    /** ID del Departamento administrativo asociado. */
    dp_id: number | null;

    /** * Bandera que indica si el usuario tiene alcance nacional.
     * * true: Puede ver datos de todas las regionales.
     * * false: Solo puede ver datos de su `reg_id`.
     */
    es_nacional: boolean;

    /** * Lista de IDs de perfiles adicionales activos.
     * Se usa para permisos granulares más allá del rol principal.
     */
    perfil_ids?: number[];
}