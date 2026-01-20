# Análisis de Flujos: Módulo Tickets

## 1. Endpoints Sugeridos
Basado en las funciones legacy, se proponen los siguientes endpoints RESTful:

### Gestión Básica
- `GET /tickets`: Listado general (Admin). Reemplaza `listar_ticket`.
- `GET /tickets/:id`: Detalle completo. Reemplaza `listar_ticket_x_id`.
- `POST /tickets`: Crear ticket.
- `PUT /tickets/:id`: Actualizar campos básicos.

### Listados Específicos
- `GET /tickets/user/me`: Mis tickets (Solicitante). Reemplaza `listar_ticket_x_usuario`.
- `GET /tickets/agent/me`: Mis asignaciones (Agente). Reemplaza `listar_ticket_x_agente`.

### Workflow y Transacciones
- `POST /tickets/:id/assign`: Reasignar y mover paso. Reemplaza `update_asignacion_y_paso`.
    - Body: `{ usuAsig: number, pasoId: number, comentario: string }`
- `POST /tickets/:id/close`: Cerrar ticket. Reemplaza `cerrar_ticket_con_nota`.
    - Body: `{ nota: string, files: File[] }`
- `GET /tickets/:id/history`: Historial completo. Reemplaza `listar_historial_completo`.

### Detalles
- `GET /tickets/:id/details`: Comentarios asociado. Reemplaza `listar_ticketdetalle_x_ticket`.
- `POST /tickets/:id/details`: Agregar comentario.

## 2. DTOs Propuestos
- `CreateTicketDto`
- `UpdateTicketDto`
- `AssignTicketDto`: `{ usuAsig: number, pasoId: number, comentario?: string }`
- `CloseTicketDto`: `{ nota: string }` (Files handled by Interceptor)
- `TicketFilterDto`: `{ status?, dateRange?, search?, categoryId? }`

## 3. Tests Unitarios Necesarios
1.  **Service > create**: Verificar asignación inicial y notificaciones.
2.  **Service > assign**: 
    - Verificar cambio de `usu_asig` (string/array handling).
    - Verificar inserción en `th_ticket_asignacion`.
    - Verificar notificación si asignado != asignador.
3.  **Service > close**:
    - Verificar cambio de estado a 'Cerrado'.
    - Verificar inserción de nota cierre.
    - Mockear subida de archivos.
4.  **Listers**:
    - Verificar scopes de filtros (status, search).
    - Verificar paginación correcta.
