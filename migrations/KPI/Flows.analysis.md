# Análisis de Flujos: KPIs y Estadísticas

## 1. Endpoints Sugeridos

### Dashboard Principal
- `GET /statistics/dashboard`: Datos agregados para la vista principal.
    - Query: `viewMode` (dept/cargo), `targetUserId`, `filters...`
    - Retorna: Totales y ChartData.

### Métricas de Desempeño
- `GET /statistics/performance/subcategory`: Tiempos promedio por paso.
    - Query: `subcategoryName`.
- `GET /statistics/performance/user`: Mediana de respuesta personal.

### Reportes Detallados
- `GET /statistics/reports/novedades`: Lista de novedades.
- `GET /statistics/reports/errors`: Lista de errores.

## 2. Tests Unitarios
1.  **HierarchyScope**:
    - Test: Admin ve 'all'.
    - Test: Jefe ve IDs subordinados (mock org tree).
    - Test: Usuario normal ve solo su ID.
2.  **DynamicQueryBuilder**:
    - Test: Verificar que los filtros opcionales (Dept, Cargo) se apliquen al WHERE.
    - Test: Verificar prevención de SQL Injection en los filtros dinámicos.
3.  **Calculation**:
    - Test: Cálculo de mediana con array par/impar.
    - Test: Cálculo de tiempos de paso (deltas entre fechas).
