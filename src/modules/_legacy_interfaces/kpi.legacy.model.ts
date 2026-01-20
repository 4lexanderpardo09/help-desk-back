/**
 * Contrato para el servicio de Estadísticas (KPI).
 */
export interface LegacyKpiModel {
    /**
     * Resuelve los IDs de usuarios visibles para el usuario actual.
     * Admin (Rol 3) -> All.
     * Jefe -> Recursive Down.
     * User -> Self.
     */
    get_hierarchy_scope(userId: number): Promise<number[] | 'all'>;

    /**
     * Dashboard Principal.
     * Calcula totales y agrupación dinámica (Chart Data).
     */
    get_dynamic_statistics(userId: number, filters: any): Promise<{
        totals: { total_abiertos: number; total_cerrados: number; total_general: number };
        chartLevel: string; // 'dept' | 'cargo' | 'user' ...
        chartData: { label: string; id: string | number; value: number }[];
    }>;

    /**
     * Métricas de desempeño por subcategoría.
     * Calcula tiempos promedio por paso de flujo.
     */
    get_subcategory_metrics(userId: number, subcatName: string, targetUserId?: number): Promise<{
        found: boolean;
        subcat_name?: string;
        chart_data?: { step_name: string; avg_minutes: number; order: number }[];
    }>;

    /**
     * Estadísticas detalladas de Novedades y Errores.
     */
    get_detailed_user_stats(userId: number, targetUserId?: number, subcatName?: string): Promise<any>;
}
