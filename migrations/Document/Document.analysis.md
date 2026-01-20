# Análisis del Modelo Legacy: Gestión Documental

## 1. Descripción General
El sistema maneja tres tipos de documentos adjuntos, distribuidos en tres tablas distintas. Los archivos físicos se almacenan en el sistema de archivos (no en DB).

## 2. Tipos de Documentos
1.  **Adjunto de Ticket (`td_documento`)**:
    - Archivos subidos al crear el ticket.
    - Tabla: `td_documento` (`tick_id`, `doc_nom`).
2.  **Adjunto de Detalle (`td_documento_detalle`)**:
    - Archivos subidos en comentarios/respuestas.
    - Tabla: `td_documento_detalle` (`tickd_id`, `det_nom`).
    - **Lógica Especial**: `get_ultimo_documento_detalle` busca archivos que empiecen con `signed_` para recuperar actas firmadas.
3.  **Adjunto de Cierre (`td_documento_cierre`)**:
    - Archivos subidos al cerrar el ticket (ej: acta final).
    - Tabla: `td_documento_cierre` (`tick_id`, `doc_nom`).

## 3. Side Effects y Almacenamiento
- Los modelos legacy (`Documento.php`) solo insertan referencias en la BD.
- La subida física (`move_uploaded_file`) ocurría en los Controladores (`ticket.php`, etc.), a menudo creando carpetas dinámicas `../../public/documentos/ticket_ID/`.

## 4. Estrategia de Migración
- **Entities**: Unificar o mantener separado. Dado que TypeORM maneja bien las entidades, podemos mantener 3 entidades separadas para claridad, o 1 entidad polimórfica. Se recomienda mantener 3 para paridad 1:1 inicial.
- **Storage**: Mover la lógica de sistema de archivos a un `StorageService` (Local/S3).
- **Interceptors**: Usar `FileInterceptor` de NestJS para manejar la subida antes de llegar al servicio.

## 5. Métodos Públicos a Migrar (Signatures)
```typescript
interface LegacyDocumentModel {
  // Ticket Attachments
  insert_documento(tickId: number, filename: string): Promise<void>;
  get_documentos_ticket(tickId: number): Promise<DocumentEntity[]>;

  // Comment Attachments
  insert_documento_detalle(tickDetailId: number, filename: string): Promise<void>;
  get_documentos_detalle(tickDetailId: number): Promise<DetailDocumentEntity[]>;
  find_last_signed_document(tickId: number): Promise<DetailDocumentEntity | null>;

  // Closing Attachments
  insert_documento_cierre(tickId: number, filename: string): Promise<void>;
  get_documentos_cierre(tickId: number): Promise<ClosingDocumentEntity[]>;
}
```
