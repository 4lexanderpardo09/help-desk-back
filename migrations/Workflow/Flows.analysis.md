# Análisis de Flujos: Motor de Workflow

## 1. Endpoints Sugeridos
El motor de flujo es un servicio interno utilizado principalmente por el módulo de Tickets, pero necesita endpoints para su administración (Backoffice) y para consultas de estado.

### Administración (Diseñador de Flujos)
- `GET /workflows`: Listar flujos.
- `GET /workflows/:id`: Ver grafo completo (pasos + transiciones).
- `POST /workflows`: Crear flujo.
- `GET /workflows/:id/steps`: Pasos de un flujo.
- `POST /workflows/:id/steps`: Añadir paso.
- `POST /workflows/:id/transitions`: Añadir transición.

### Ejecución (Runtime) - Usados por el Frontend de Ticket
- `GET /workflows/next-step`: Previsualizar siguiente paso.
    - Query: `currentStepId`, `decision`.
- `GET /workflows/transitions`: Obtener botones disponibles.
    - Query: `currentStepId`.
- `GET /workflows/form-config`: Obtener configuración de formulario dinámico.
    - Query: `stepId`, `companyId`.

## 2. DTOs Propuestos
- `CreateWorkflowDto`
- `CreateStepDto` (Con todos los flags booleanos).
- `CreateTransitionDto`: `{ sourceStepId, targetStepId?, targetRouteId?, conditionKey, conditionName }`
- `StepConfigDto`: Coordenadas firma, campos plantilla.

## 3. Tests Unitarios Necesarios
1.  **WorkflowEngine > Navigation**:
    - Test: Paso 1 -> Paso 2 (Secuencial).
    - Test: Paso 1 -> Decisión A -> Paso 3 (Transición).
    - Test: Paso 1 -> Decisión B -> Ruta X -> Paso X1.
2.  **WorkflowResolver > Assignments**:
    - Test: Resolver "Jefe Inmediato" (Mockear User service).
    - Test: Resolver "Usuarios Específicos".
3.  **WorkflowLegacy**:
    - Verificar que los modelos legacy lean la estructura antigua correctamente.
