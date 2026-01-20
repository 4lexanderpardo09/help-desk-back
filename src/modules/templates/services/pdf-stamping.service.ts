import { Injectable, Logger } from '@nestjs/common';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as fs from 'fs/promises';

export interface TextStampConfig {
    text: string;
    x: number;
    y: number;
    page: number; // 1-based index
    size?: number;
    color?: { r: number; g: number; b: number };
}

@Injectable()
export class PdfStampingService {
    private readonly logger = new Logger(PdfStampingService.name);

    /**
     * Carga un PDF desde disco, estampa texto en coordenadas específicas y devuelve los bytes.
     * NO guarda en disco a menos que se provea `outputPath`.
     *
     * @param inputPath Ruta absoluta o relativa al archivo PDF base.
     * @param texts Array de objetos con configuración de texto (x, y, página, color).
     * @param outputPath (Opcional) Ruta donde guardar el archivo generado.
     * @returns Uint8Array con el contenido del PDF modificado.
     * @throws Error si el archivo no existe o las coordenadas son inválidas.
     *
     * @example
     * const pdfBytes = await service.stampPdf('template.pdf', [
     *   { text: 'Aprobado', x: 100, y: 50, page: 1, color: { r: 1, g: 0, b: 0 } }
     * ]);
     */
    async stampPdf(
        inputPath: string,
        texts: TextStampConfig[],
        outputPath?: string,
    ): Promise<Uint8Array> {
        try {
            this.logger.log(`Stamping PDF: ${inputPath} with ${texts.length} fields`);

            const existingPdfBytes = await fs.readFile(inputPath);
            const pdfDoc = await PDFDocument.load(existingPdfBytes);
            const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const pages = pdfDoc.getPages();

            for (const item of texts) {
                const pageIndex = item.page - 1;
                if (pageIndex < 0 || pageIndex >= pages.length) {
                    this.logger.warn(`Page ${item.page} out of bounds for PDF with ${pages.length} pages. Skipping.`);
                    continue;
                }

                const page = pages[pageIndex];
                const { height } = page.getSize();

                // Coordenada Y en PDF-Lib es desde abajo-izquierda (Cartesiano).
                // Los sistemas legacy (FPDF) suelen usar arriba-izquierda.
                // Asumimos input legacy y convertimos: y = height - y.
                const stampedY = height - item.y;

                page.drawText(item.text, {
                    x: item.x,
                    y: stampedY,
                    size: item.size || 10,
                    font: helveticaFont,
                    color: item.color ? rgb(item.color.r, item.color.g, item.color.b) : rgb(0, 0, 0),
                });
            }

            const pdfBytes = await pdfDoc.save();

            if (outputPath) {
                await fs.writeFile(outputPath, pdfBytes);
                this.logger.log(`Saved stamped PDF to: ${outputPath}`);
            }

            return pdfBytes;
        } catch (error) {
            this.logger.error(`Error stamping PDF: ${error.message}`, error.stack);
            throw error;
        }
    }
}
