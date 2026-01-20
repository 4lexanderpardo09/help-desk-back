# Análisis del Modelo Legacy: Ticket.php

## 1. Descripción General
El archivo `Ticket.php` actúa como un modelo Active Record sobrecargado que gestiona la lógica central de los tickets. No solo define la estructura de datos (implícitamente a través de SQL), sino que también maneja transacciones de negocio complejas, notificaciones, subida de archivos y consultas de listado masivas con filtros dinámicos.

## 2. Responsabilidades Identificadas
1.  **CRUD Básico**: (Implícito) Actualización de estados y campos.
2.  **Gestión de Flujo (Workflow)**: `update_asignacion_y_paso` maneja la transición de pasos y reasignaciones.
3.  **Auditoría**: Inserción manual en `th_ticket_asignacion` cada vez que cambia el asignado.
4.  **Cierre de Ticket**: `cerrar_ticket_con_nota` orquesta update estado + nota cierre + archivos + notificaciones masivas.
5.  **Notificaciones**: Generación e inserción de alertas en `tm_notificacion` para asignaciones y cierres.
6.  **Consultas Complejas (Listers)**:
    *   `listar_ticket_x_usuario`: Listado para solicitantes.
    *   `listar_ticket_x_agente`: Listado para agentes (soporta lógica de "mis tickets" + "históricos" si está cerrado).
    *   `listar_historial_completo`: Construcción de timeline uniendo eventos de creación, comentarios, asignaciones y cierre.

## 3. Estructura de Datos (Entradas/Salidas)

### Campos Clave (Inferidos de SQLs):
- `tick_id` (PK)
- `usu_id` (Dueño/Solicitante)
- `cat_id`, `cats_id` (Categorización)
- `emp_id`, `dp_id`, `reg_id` (Contexto organizacional)
- `tick_titulo`, `tick_descrip` (Contenido)
- `tick_estado` (Enum: Abierto, Cerrado, etc.)
- `fech_crea`, `fech_cierre`
- `usu_asig` (Legacy: string CSV de IDs, ej "1,2,3")
- `paso_actual_id` (Workflow engine)
- `ruta_id`, `ruta_paso_orden` (Workflow context)

### Relaciones Implícitas:
- `tm_usuario` (Solicitante, Asignados)
- `tm_categoria`, `tm_subcategoria`
- `td_prioridad` (Prioridad usuario y defecto)
- `td_empresa`, `tm_departamento`
- `tm_flujo_paso` (Paso actual)
- `td_ticketdetalle` (Comentarios)
- `th_ticket_asignacion` (Historial asignaciones)
- `td_documento` (Adjuntos)

## 4. Side Effects y Lógica Oculta
1.  **Transformer de Usuarios Asignados**: El campo `usu_asig` es un string CSV en base de datos. El nuevo sistema lo maneja como array, pero el legacy lo trata como string para `FIND_IN_SET`.
2.  **Historial "Manual"**: No usa triggers. El código PHP es responsable de insertar en `th_ticket_asignacion`. Si migramos a TypeORM, debemos garantizar que los servicios repliquen esto o usar Subscribers.
3.  **Notificaciones Hardcodeadas**: La lógica de qué mensaje enviar está construida con concatenación de strings dentro del método SQL.
4.  **Sistema de Archivos**: `cerrar_ticket_con_nota` crea carpetas físicas (`mkdir`) y mueve archivos.

## 5. Estrategia de Migración
- **Entidad**: Usar la ya definida `Ticket.entity.ts` en `src/modules/tickets/entities/`. Es robusta y ya tiene el transformer para `usu_asig`.
- **Repositorio/Servicio**:
    - Las consultas `listar_` deben migrar a `TicketListerService` usando `QueryBuilder` optimizado.
    - La lógica de `update_asignacion_y_paso` debe ser un método transaccional en `TicketsService` (o `WorkflowService`).
    - `cerrar_ticket_con_nota` debe ser un UseCase o método servicio que coordine `StorageService`, `MailService` y `TicketsRepository`.

## 6. Métodos Públicos a Migrar (Signatures)
```typescript
// En modules/tickets/models/legacy-ticket.model.ts

interface LegacyTicketModel {
  update_asignacion_y_paso(
    tickD: number, 
    usuAsig: number, 
    pasoId: number, 
    quienAsigno: number, 
    comentario?: string, 
    notificacion?: string
  ): Promise<void>;

  cerrar_ticket_con_nota(
    tickId: number, 
    usuId: number, 
    nota: string, 
    files: any[]
  ): Promise<void>;

  listar_ticket_x_usuario(usuId: number, filters: any): Promise<any>;
  listar_ticket_x_agente(usuAsig: number, filters: any): Promise<any>;
  listar_historial_completo(tickId: number): Promise<any[]>;
}
```
