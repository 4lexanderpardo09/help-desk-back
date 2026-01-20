# Análisis del Servicio Legacy: TicketService.php

## 1. Descripción General
`TicketService.php` es el **orquestador principal del sistema** con 2633 líneas y 132KB. Coordina:
- Creación y Cierre de Tickets
- Motor de Workflows (Avance, Rutas, Transiciones)
- Asignación de Usuarios (Paralelo, Jefe, Cargo)
- Procesamiento de Plantillas PDF
- Notificaciones

## 2. Responsabilidades Críticas

### 2.1 `createTicket()` - Orquestador de Creación
1. Valida datos y obtiene info del creador.
2. **Resolve Assigned**: Determina el usuario asignado basado en:
   - Si es manual (usu_asig en request).
   - Si el paso es paralelo (múltiples asignados).
   - Lógica de "Jefe Inmediato" (Organigrama).
   - Lógica de cargo regional/nacional.
3. Inserta el ticket (`TicketRepository`).
4. Crea registros de asignación (`AssignmentRepository`).
5. Si es paralelo, crea `tm_ticket_paralelo`.
6. Genera notificaciones.
7. **PDF Stamping**: Llama a `handleDynamicFields()` para estampar datos en PDFs.

### 2.2 `handleDynamicFields()` - Motor de PDF
1. Obtiene campos del paso (`get_campos_por_paso`).
2. Resuelve valores especiales (Cargo -> Nombre, Regional -> Nombre).
3. Determina si existe documento previo firmado (Accumulative PDF).
4. Copia la plantilla base (por Flujo o por Empresa).
5. **Stamping**: Usa `PdfService` para insertar texto en coordenadas X,Y.
6. **Jefe Resolution**: Si los campos capturan Cargo+Regional, resuelve el jefe y lo guarda en `tm_ticket.usu_id_jefe_aprobador`.

### 2.3 `actualizar_estado_ticket()` - Motor de Avance
1. Valida si el paso actual permite avanzar (vs `cerrar_ticket_obligatorio`).
2. Obtiene el siguiente paso.
3. **Lógica Paralela**: Resuelve múltiples asignados usando usuarios/cargos específicos, configuración de firma, y Jefe Inmediato.
4. Maneja `manual_assignments` del frontend.
5. Actualiza `tm_ticket` y crea nuevas asignaciones.

## 3. Dependencias
- 15+ Modelos Legacy (Flujo, Usuario, Organigrama, etc.)
- 4 Repositories (Ticket, Notification, Assignment, Novedad)
- 2 Services (WorkflowService, PdfService)

## 4. Estrategia de Migración
- **Descomposición**: Este servicio monolítico debe partirse en:
  1. `TicketsService` (CRUD básico).
  2. `TicketCreationService` (Orquestación de creación).
  3. `TicketAdvancementService` o `WorkflowEngineService` (Motor de avance).
  4. `PdfStampingService` (Manejo de PDFs).
  5. `AssignmentResolver` (Lógica de asignación).
- **Transacciones**: Usar `QueryRunner` de TypeORM para orquestar transacciones distribuidas.

## 5. Métodos Públicos a Migrar (Signatures)
```typescript
interface LegacyTicketService {
  createTicket(data: CreateTicketDto, files?: Express.Multer.File[]): Promise<TicketCreationResult>;
  
  resolveAssigned(flujo: any, creadorId: number, regionalId: number, postData?: any): Promise<ResolveResult>;
  
  actualizar_estado_ticket(
    ticketId: number, 
    nuevoPasoId: number, 
    rutaId?: number, 
    orden?: number, 
    usuAsig?: number, 
    manualAssignments?: ManualAssignment[]
  ): Promise<void>;
  
  avanzar_ticket_lineal(ticket: TicketInfo, usuAsig?: number): Promise<void>;
  avanzar_ticket_en_ruta(ticket: TicketInfo, usuAsig?: number): Promise<void>;
  iniciar_ruta_para_ticket(ticket: TicketInfo, rutaId: number): Promise<void>;
  
  cerrar_ticket(ticketId: number, motivo: string): Promise<void>;
}
```
