# Análisis del Modelo Legacy: KPI y Estadísticas

## 1. Descripción General
El modelo `Kpi.php` es un motor de análisis masivo que combina lógica de permisos recursiva con agregación de datos estadísticos. No es un simple CRUD; es un módulo de Business Intelligence (BI).

## 2. Responsabilidades Críticas
### 2.1 Scope Jerárquico (`get_hierarchy_scope`)
- Determina recursivamente qué usuarios puede ver un solicitante.
- Regla: `Admin` -> All. `Jefe` -> Árbol descendente de cargos. `User` -> Self.
- Esta lógica es fundamental para la seguridad de los datos.

### 2.2 Estadísticas Dinámicas (`get_dynamic_statistics`)
- Construye WHERE clauses al vuelo basándose en el alcance (Scope) y filtros UI.
- Calcula totales (Abierto/Cerrado) y Data Sets para gráficos (Group By dinámico: Depto, Cargo, Usuario, Categoría).

### 2.3 Métricas de Desempeño (`get_subcategory_metrics`)
- Reconstruye el ciclo de vida de un ticket usando `th_ticket_asignacion`.
- Calcula la duración de cada paso en minutos.
- Lógica de "Naming Manual" para pasos virtuales (ej: 'Novedad' si no tiene nombre de paso pero sí flag de novedad).

### 2.4 Mediana de Respuesta (`get_mediana_respuesta`)
- Algoritmo manual de cálculo de mediana (no AVG) para tiempos de respuesta, excluyendo valores atípicos.

## 3. Entidades Involucradas (Read-Only)
- `tm_ticket`
- `th_ticket_asignacion`
- `th_ticket_novedad`
- `tm_ticket_error`
- `tm_usuario`, `tm_cargo`, `tm_departamento` (Dimensiones)

## 4. Estrategia de Migración
- **Service**: `TicketStatisticsService`.
- **Optimization**: El uso de query raw con joins condicionales es peligroso. Se debe migrar a `QueryBuilder` con métodos como `.andWhere(brackets => ...)` para manejar los filtros opcionales de forma segura.
- **Caching**: Estas consultas son pesadas. Se recomienda implementar cache (Redis/Memory) para `get_hierarchy_scope` y resultados agregados.

## 5. Métodos Públicos a Migrar (Signatures)
```typescript
interface LegacyKpiModel {
  get_scope(userId: number): Promise<number[] | 'all'>; // Returns list of visible User IDs
  
  get_dashboard_stats(userId: number, filters: DashboardFilters): Promise<DashboardData>;
  
  get_performance_metrics(userId: number, subcategoryName: string): Promise<StepMetric[]>;
  
  get_median_response_time(userId: number): Promise<number>; // Minutes
}
```
