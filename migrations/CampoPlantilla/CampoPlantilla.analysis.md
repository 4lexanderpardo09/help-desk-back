# Análisis del Modelo Legacy: CampoPlantilla.php

## 1. Descripción General
`CampoPlantilla.php` maneja los **campos dinámicos de formularios** vinculados a pasos del flujo. Permite configurar inputs extra que se renderizan al crear/avanzar tickets, y cuyos valores se estampan en PDFs.

## 2. Tablas Gestionadas
1.  **`tm_campo_plantilla`**: Definición de campos (Config).
    - `paso_id`, `campo_nombre`, `campo_codigo`.
    - `coord_x`, `coord_y`, `pagina`, `font_size` (Para estampado PDF).
    - `campo_tipo`: text, regional, cargo, date, etc.
    - `campo_trigger`: Si es 1, este campo dispara autocomplete.
    - `campo_query`: Query de lookup (ID de `tm_consulta`, Preset, o SQL raw).
2.  **`td_ticket_campo_valor`**: Valores capturados por ticket.
    - `tick_id`, `campo_id`, `valor`.

## 3. Lógica Especial
### 3.1 `ejecutar_query_campo()`
Motor de **autocomplete dinámico**:
1.  Si `campo_query` empieza con `EXCEL:` → Busca en datos JSON subidos.
2.  Si empieza con `PRESET_` → Ejecuta queries predefinidos (ej: buscar usuario por cédula).
3.  Si es numérico → Es un ID de `tm_consulta`, busca la query SQL y la ejecuta.
4.  Else → Ejecuta SQL raw (¡Riesgo de Injection!).

### 3.2 Resolución de Valores
Cuando el tipo es `regional` o `cargo`, resuelve IDs a nombres consultando `Cargo.php` y `Regional.php`.

### 3.3 Días Transcurridos
`get_campos_con_dias_transcurridos()` calcula semanas/días desde una fecha almacenada (para mostrar SLA).

## 4. Estrategia de Migración
- **Entity**: `CampoPlantilla` para definición, `TicketCampoValor` para valores.
- **Service**: `TemplateFieldService`.
- **Security**: Eliminar ejecución de SQL raw. Solo permitir IDs de `tm_consulta` previamente validadas.

## 5. Métodos Públicos
```typescript
interface LegacyTemplateFieldModel {
  get_campos_por_paso(pasoId: number): Promise<CampoConfig[]>;
  insert_ticket_valor(ticketId: number, campoId: number, valor: string): Promise<void>;
  get_valores_por_ticket(ticketId: number): Promise<CampoValor[]>;
  ejecutar_query_campo(campoId: number, valorBusqueda: string): Promise<any>;
}
```
