# Análisis del Servicio Legacy: PdfService.php

## 1. Descripción General
`PdfService.php` (114 líneas) es un wrapper sobre `Fpdi` (FPDF + Import) para manipulación de PDFs existentes. Se usa principalmente para **estampar firmas** y **llenar campos dinámicos** en plantillas PDF.

## 2. Responsabilidades Críticas
1.  **`firmarPdfMultiple`**: Inserta imágenes de firma en coordenadas (X,Y) específicas. Copia página por página el PDF original para regenerarlo con la firma superpuesta.
2.  **`estamparTexto`**: Inserta texto plano en coordenadas X,Y. Usado para llenar los valores de `CampoPlantillaLegacy` en los PDFs generados.

## 3. Dependencias
- `setasign/fpdi`: Librería PHP clave.
- Filesystem: Lee y escribe archivos en disco local (`public/document/...`).

## 4. Estrategia de Migración
- **Library**: Usar `pdf-lib` en Node.js (potente, zero-dependency, pure JS).
- **Service**: `PdfStampingService`.
- **Logic**: Mantener la lógica de coordenadas X,Y es trivial con `pdf-lib`.

## 5. Métodos Públicos
```typescript
interface LegacyPdfService {
  signPdf(filePath: string, signatureImagePath: string, signatures: SignatureConfig[]): Promise<void>;
  stampText(filePath: string, texts: TextConfig[]): Promise<void>;
}

interface SignatureConfig {
  x: number;
  y: number;
  page: number;
}
```
