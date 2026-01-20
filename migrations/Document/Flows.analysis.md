# Análisis de Flujos: Gestión Documental

## 1. Endpoints Sugeridos

### Gestión de Archivos
- `POST /documents/upload`: Subida genérica. Retorna metadatos del archivo subido.
    - Interceptor: `FileInterceptor('file')`.
    - Storage: Guardar en `public/uploads/{YYYY}/{MM}/` (o S3).
- `GET /documents/:id/download`: Descargar archivo.

### Vinculación (Business Logic)
- `POST /tickets/:id/attachments`: Vincular archivo a Ticket (`td_documento`).
    - Body: `{ filename: string, originalName: string }`
- `POST /tickets/:id/comments/:commentId/attachments`: Vincular a Comentario (`td_documento_detalle`).
- `POST /tickets/:id/closing-attachments`: Vincular a Cierre (`td_documento_cierre`).

## 2. Tests Unitarios
1.  **StorageService**:
    - Test: Subida física correcta.
    - Test: Generación de nombres únicos (UUID).
2.  **DocumentService**:
    - Test: Insertar referencia en BD (`td_documento`) apunta al path correcto.
    - Test: `getLastSignedDocument` filtra correctamente por patrón de nombre.
3.  **Security**:
    - Test: Validación de MIME types permitidos.
    - Test: Solo el dueño o asignado puede ver/descargar adjuntos.
