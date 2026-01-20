/**
 * Interface del modelo Legacy Usuario.php
 */
export interface LegacyUsuarioModel {
    /**
     * Valida credenciales y establece sesión.
     * Legacy: Verifica si es jefe usando OrganigramaModel.
     */
    login(correo: string, pass: string, rol_id: number): Promise<boolean>;

    insert_usuario(
        usu_nom: string, usu_ape: string, usu_correo: string, usu_pass: string,
        rol_id: number, dp_id: number | null, es_nacional: number,
        reg_id: number, car_id: number, usu_cedula?: string
    ): Promise<number>;

    update_usuario(
        usu_id: number, usu_nom: string, usu_ape: string, usu_correo: string,
        usu_pass: string | null, rol_id: number, dp_id: number | null,
        es_nacional: number, reg_id: number, car_id: number
    ): Promise<void>;

    delete_usuario(usu_id: number): Promise<void>;

    /** Búsqueda por correo para recuperación o login */
    get_usuario_por_correo(usu_correo: string): Promise<any>;

    /**
     * Búsqueda compleja: Usuario de un cargo específico que pertenezca
     * a la misma regional O que sea nacional.
     */
    get_usuarios_por_cargo_regional_o_nacional(car_id: number, reg_id: number): Promise<any[]>;

    /**
     * Búsqueda compleja: Usuario de un cargo en una ZONA específica.
     * Requiere JOIN con tm_regional -> tm_zona.
     */
    get_usuario_por_cargo_y_zona(car_id: number, zona_nombre: string): Promise<any>;

    // Recuperación de Contraseña
    generar_token_recuperacion(usu_correo: string): Promise<string | false>;
    validar_token_recuperacion(token: string): Promise<any>;
    restablecer_contrasena(token: string, new_pass: string): Promise<boolean>;

    // Gestión de Perfiles
    insert_usuario_perfil(usu_id: number, per_ids: number[]): Promise<void>;
    get_perfiles_por_usuario(usu_id: number): Promise<any[]>;
}
