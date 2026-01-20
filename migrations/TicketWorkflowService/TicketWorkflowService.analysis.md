# Análisis del Servicio Legacy: TicketWorkflowService.php

## 1. Descripción General
`TicketWorkflowService.php` (200 líneas) maneja la lógica de **transiciones de estado** y **resolución de asignaciones** automática dentro del flujo de trabajo. Funciona en conjunto con `TicketService` pero se especializa en la navegación del grafo de workflow.

## 2. Responsabilidades Críticas

### 2.1 `transitionStep()` - Motor de Avance
1.  **SLA Calculation**: Calcula si el paso anterior se completó "A Tiempo" o "Atrasado" usando `DateHelper`.
2.  **Next Step Resolution**:
    - Si se provee ID directo → Usa ese paso.
    - Si se provee clave (string) → Busca en `tm_flujo_transicion`.
    - Default: Siguiente paso lineal.
3.  **Assignee Resolution**:
    - Si es tarea nacional (`es_tarea_nacional`): Busca usuario nacional por cargo.
    - Si es standard: Busca usuario por cargo + regional del ticket.
    - Actualiza `tm_ticket.usu_asig` y `tm_ticket.paso_id`.

### 2.2 `ApproveFlow()` - Aprobación Manual
- Utilizado por "Jefes" para aprobar tickets retenidos.
- Reinicia el flujo asignando al primer paso de soporte.

### 2.3 `CheckStartFlow()` - Pre-flight Check
- Verifica si el primer paso del flujo requiere selección manual de usuario.
- Devuelve la lista de candidatos permitidos (por cargo o usuarios específicos) al frontend antes de crear el ticket.

## 3. Estrategia de Migración
- **Module**: `WorkflowsModule`.
- **Service**: `WorkflowEngineService`.
- **Refactor**: Extraer la lógica de SLA a `SlaService`. Integrar `AssigneeResolver` como provider separado para testear reglas de asignación aisladamente.

## 4. Métodos Públicos
```typescript
interface LegacyWorkflowEngine {
  transitionStep(
    ticketId: number, 
    transitionKeyOrStepId: string | number, 
    actorId: number
  ): Promise<void>;

  approveFlow(ticketId: number, approverId: number): Promise<void>;

  checkStartFlow(subcategoryId: number): Promise<{
    requiresManualSelection: boolean;
    candidates: UserCandidateDto[];
  }>;
}
```
