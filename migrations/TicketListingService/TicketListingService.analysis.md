# Análisis del Servicio Legacy: Ticket Listing & Details

## 1. Descripción General
Los servicios `TicketLister.php` y `TicketDetailLister.php` son responsables de la **recuperación y presentación de datos**. No manejan lógica de negocio de mutación (escritura), pero contienen lógica compleja de **lectura y formateo**.

- **`TicketLister.php`**: Gestión de Datatables (paginación, ordenamiento, filtrado) para bandejas de usuario, soporte, observadores y reportes de error.
- **`TicketDetailLister.php`**: Construcción de la línea de tiempo del ticket (historial, comentarios, adjuntos).

## 2. Responsabilidades Críticas

### 2.1 TicketLister (32KB, 658 líneas)
1.  **Orquestación de Datatables**: Recibe parámetros `$_POST` (start, length, order, search) y los pasa a `Ticket.php`.
2.  **HTML Rendering**: Genera HTML (labels, botones) directamente en el PHP.
    - *Migración*: Esto debe moverse al Frontend. El backend solo debe retornar DTOs con `status`, `priority`, etc.
3.  **Roles Views**: Diferencia vistas para Usuario (`listTicketsByUser`), Agente (`listTicketsByAgent`) y General (`listAllTickets`).
4.  **Error Reporting**: Listados de "Mis Errores" y "Errores Reportados".

### 2.2 TicketDetailLister (12KB, 226 líneas)
1.  **Timeline Construction**: Unifica comentarios, cambios de estado, asignaciones y cierres en una sola lista cronológica.
2.  **Document Attachment Parsing**: Parsea cadenas de texto con pipes `|` (`doc1.pdf|doc2.jpg`) para mostrar adjuntos.
3.  **Signed Flow Documents**: Recupera y muestra documentos de flujo firmados (`DocumentoFlujo`).

## 3. Estrategia de Migración

### 3.1 Separación de Responsabilidades
- **Frontend (React)**: Datatables serverside, renderizado de badges/botones, formateo de fechas.
- **Backend (NestJS)**:
  - `TicketListingService`: Encargado de queries complejas y filtros.
  - `TicketHistoryService`: Encargado de reconstruir el timeline.
- **DTOs**: Salida tipada estricta, evitando `any`.

### 3.2 Endpoints Sugeridos
- `GET /tickets/list/user`: Mis tickets.
- `GET /tickets/list/agent`: Tickets asignados.
- `GET /tickets/:id/timeline`: Historial completo (comentarios + eventos).

## 4. Métodos Públicos (Signatures)
```typescript
interface LegacyListingService {
  // TicketLister
  listTicketsByUser(userId: number, filters: TicketFilterDto): Promise<PaginatedResult<TicketListItemDto>>;
  listTicketsByAgent(agentId: number, filters: TicketFilterDto): Promise<PaginatedResult<TicketListItemDto>>;
  listTicketsErrors(userId: number, type: 'received' | 'reported'): Promise<PaginatedResult<TicketErrorItemDto>>;
  
  // TicketDetailLister
  getTicketTimeline(ticketId: number): Promise<TimelineItemDto[]>;
  getLastSignedDocument(ticketId: number): Promise<SignedDocumentDto | null>;
}
```
