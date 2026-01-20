# Análisis del Modelo Legacy: Workflow Engine (Flujo)

## 1. Descripción General
El sistema de flujos es un motor de máquina de estados finito (FSM) avanzado. No es una simple lista secuencial; permite ramificaciones condicionales, sub-rutinas (Rutas) y formularios dinámicos (Plantillas).

## 2. Conceptos Clave
### 2.1 Flujo (`tm_flujo`)
Contenedor principal. Asociado a una Subcategoría (`cats_id`).
- **Templates**: Se vincula con `tm_flujo_plantilla` por Empresa (`emp_id`), permitiendo que el mismo flujo tenga formularios diferentes según la empresa del solicitante.
- **Observer**: `usu_id_observador` recibe notificaciones pasivas.

### 2.2 Paso (`tm_flujo_paso`)
Unidad atómica de trabajo.
- **Flags de Comportamiento**:
    - `es_aprobacion`, `requiere_firma`.
    - `necesita_aprobacion_jefe`, `campo_id_referencia_jefe`.
    - `asignar_a_creador`: Auto-asignación.
- **Asignación Dinámica**:
    - Por Cargo (`cargo_id_asignado`).
    - Usuarios Específicos (`tm_flujo_paso_usuarios`).
    - Jefe Inmediato (`-1` sentinel value).
- **Form Config**: `tm_campo_plantilla` define inputs extra para ese paso.
- **Firma Config**: `tm_flujo_paso_firma` coordenadas X,Y para estampar firma en PDF.

### 2.3 Transición (`tm_flujo_transiciones`)
Motor de decisión.
- Si no existe transición explícita: **Lógica Secuencial** (`paso_orden + 1`).
- Si existe transición: Evalúa `condicion_clave` (ej: approved/rejected).
- **Destinos**:
   - `paso_destino_id`: Salto directo a otro paso.
   - `ruta_id`: Salto a una **Sub-Ruta**.

### 2.4 Ruta (`tm_ruta` + `tm_ruta_paso`)
Sub-flujos reutilizables o dinámicos.
- `Ruta` agrupa pasos (`tm_ruta_paso`) en un orden específico.
- Permite modularizar partes del proceso.

## 3. Lógica de Negocio Crítica (Side Effects)
1.  **Get Siguiente Paso**:
    - Primero busca en `tm_flujo_transiciones` usando input de decisión.
    - Si no encuentra, busca `paso_orden + 1` en el mismo flujo.
    - Si encuentra `ruta_id`, debe resolver el primer paso de esa ruta (`RutaPaso` con orden 1).
2.  **Resolución de Aprobadores**:
    - Debe interpretar `-1` como "Buscar Jefe del Solicitante" (usando `tm_usuario.car_id` -> Organigrama).
    - Debe combinar `cargo_id_asignado` + `tm_flujo_paso_usuarios`.

## 4. Estrategia de Migración
- **Entities**: Migrar 1:1 a `_legacy_entities`.
- **Services**:
    - `WorkflowReadService`: Para interpretar el grafo de pasos (read-only).
    - `WorkflowEngineService`: Para ejecutar transiciones (stateful).
    - `WorkflowAdminService`: CRUD del diseñador de flujos.
- **Reglas de Mapeo**: Ya implementado en `ReglasMapeoService`.

## 5. Métodos Públicos a Migrar (Signatures)
```typescript
interface LegacyWorkflowModel {
  // Navigation
  get_paso_inicial(flujoId: number): Promise<WorkflowStep>;
  get_siguiente_paso(pasoActualId: number, decision?: string): Promise<WorkflowStep>;
  get_siguientes_pasos(pasoActualId: number): Promise<WorkflowStep[]>; // Posibles caminos
  
  // Resolution
  get_usuarios_para_paso(pasoId: number, solicitanteId: number): Promise<User[]>;
  
  // Configuration
  get_plantilla_form(flujoId: number, empId: number): Promise<string>;
  get_configuracion_paso(pasoId: number): Promise<StepConfig>; // Firma + Campos
}
```
