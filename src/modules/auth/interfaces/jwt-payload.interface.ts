export interface JwtPayload {
    usu_id: number;
    usu_correo: string;
    rol_id: number | null;
    reg_id: number | null;
    car_id: number | null;
    dp_id: number | null;
    es_nacional: boolean;
    perfil_ids?: number[];
}
