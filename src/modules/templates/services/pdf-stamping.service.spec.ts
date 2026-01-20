import { Test, TestingModule } from '@nestjs/testing';
import { PdfStampingService } from './pdf-stamping.service';
import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs/promises';

// Mock fs/promises
jest.mock('fs/promises');

describe('PdfStampingService', () => {
    let service: PdfStampingService;
    let emptyPdfBytes: Uint8Array;

    beforeAll(async () => {
        // Create a valid PDF buffer for testing
        const doc = await PDFDocument.create();
        doc.addPage([500, 500]);
        emptyPdfBytes = await doc.save();
    });

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [PdfStampingService],
        }).compile();

        service = module.get<PdfStampingService>(PdfStampingService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should read file, stamp text, and write to output', async () => {
        // Mock fs.readFile to return our empty PDF
        (fs.readFile as jest.Mock).mockResolvedValue(emptyPdfBytes);
        // Mock fs.writeFile
        (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

        const inputs = [
            { text: 'Hello World', x: 50, y: 50, page: 1, size: 12 },
        ];

        await service.stampPdf('input.pdf', inputs, 'output.pdf');

        // Verify readFile was called
        expect(fs.readFile).toHaveBeenCalledWith('input.pdf');
        // Verify writeFile was called with some Uint8Array
        expect(fs.writeFile).toHaveBeenCalledWith('output.pdf', expect.any(Uint8Array));
    });

    it('should return bytes if output path is not provided', async () => {
        (fs.readFile as jest.Mock).mockResolvedValue(emptyPdfBytes);

        const inputs = [
            { text: 'Hello World', x: 50, y: 50, page: 1 },
        ];

        const result = await service.stampPdf('input.pdf', inputs);
        expect(result).toBeInstanceOf(Uint8Array);
        expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it('should handle zero inputs gracefully', async () => {
        (fs.readFile as jest.Mock).mockResolvedValue(emptyPdfBytes);
        const result = await service.stampPdf('input.pdf', []);
        expect(result).toBeInstanceOf(Uint8Array);
    });
});
