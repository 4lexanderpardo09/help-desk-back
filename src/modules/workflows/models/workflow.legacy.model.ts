import { FlujoPasoLegacy } from '../../_legacy_entities/workflow.entities';

/**
 * Contrato para el motor de flujos.
 */
export interface LegacyWorkflowModel {
    // Lectura de Definiciones
    get_flujo_por_subcategoria(subcategoriaId: number): Promise<any>;
    get_paso_inicial(flujoId: number): Promise<FlujoPasoLegacy>;

    /**
     * Motor de Navegación:
     * Calcula el siguiente paso basado en el paso actual y una decisión opcional.
     * Soporta saltos a Rutas (resolviendo el primer paso de la ruta).
     */
    get_siguiente_paso(
        pasoActualId: number,
        condicionClave?: string
    ): Promise<FlujoPasoLegacy | null>;

    /**
     * Obtiene todos los posibles caminos desde el paso actual.
     * Utilizado para mostrar botones de decisión al usuario (ej: Aprobar/Rechazar).
     */
    get_transiciones_disponibles(pasoActualId: number): Promise<any[]>;

    // Resolución de Asignación
    /**
     * Resuelve QUIÉN debe atender el paso.
     * Combina:
     * 1. Cargo asignado en tm_flujo_paso
     * 2. Usuarios específicos en tm_flujo_paso_usuarios
     * 3. Lógica de "Jefe Inmediato" (-1)
     * 4. Auto-asignación al creador
     */
    resolve_step_assignees(pasoId: number, solicitanteId: number): Promise<number[]>; // User IDs

    // Rutas (Sub-flows)
    get_pasos_de_ruta(rutaId: number): Promise<FlujoPasoLegacy[]>;
}
