import 'multer';
import { Injectable, NotFoundException, BadRequestException, StreamableFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Documento } from '../entities/documento.entity';
import { DocumentoDetalle } from '../entities/documento-detalle.entity';
import { DocumentoCierre } from '../entities/documento-cierre.entity';
import { StorageService } from './storage.service';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { TicketDetalle } from '../../tickets/entities/ticket-detalle.entity';

@Injectable()
export class DocumentsService {
    constructor(
        @InjectRepository(Documento)
        private readonly documentoRepo: Repository<Documento>,
        @InjectRepository(DocumentoDetalle)
        private readonly docDetalleRepo: Repository<DocumentoDetalle>,
        @InjectRepository(DocumentoCierre)
        private readonly docCierreRepo: Repository<DocumentoCierre>,
        @InjectRepository(Ticket)
        private readonly ticketRepo: Repository<Ticket>,
        @InjectRepository(TicketDetalle)
        private readonly ticketDetalleRepo: Repository<TicketDetalle>,
        private readonly storageService: StorageService,
    ) { }

    /**
     * Saves a ticket file from buffer (System generated or other source)
     */
    async saveTicketFile(ticketId: number, buffer: Buffer, filename: string): Promise<Documento> {
        const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
        if (!ticket) throw new NotFoundException(`Ticket ${ticketId} not found`);

        await this.storageService.saveBuffer(buffer, `documentos/${ticketId}`, filename);

        const documento = this.documentoRepo.create({
            ticketId,
            nombre: filename,
            fechaCreacion: new Date(),
            estado: 1
        });

        return this.documentoRepo.save(documento);
    }

    /**
     * Attach a document to a Ticket (Main attachment)
     */
    async attachToTicket(ticketId: number, file: Express.Multer.File): Promise<Documento> {
        const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
        if (!ticket) throw new NotFoundException(`Ticket ${ticketId} not found`);

        const fileName = await this.storageService.save(file, `documentos/${ticketId}`);

        const documento = this.documentoRepo.create({
            ticketId,
            nombre: fileName.split('/').pop()!,
            fechaCreacion: new Date(),
            estado: 1
        });

        return this.documentoRepo.save(documento);
    }

    /**
     * Attach a document to a Ticket Comment/Detail
     */
    async attachToTicketDetail(ticketDetalleId: number, file: Express.Multer.File): Promise<DocumentoDetalle> {
        const detalle = await this.ticketDetalleRepo.findOne({ where: { id: ticketDetalleId } });
        if (!detalle) throw new NotFoundException(`Ticket Detail ${ticketDetalleId} not found`);

        // We need ticketId for folder structure
        const ticketId = detalle.ticketId;

        const fileName = await this.storageService.save(file, `documentos/${ticketId}`);
        const actualSavedName = fileName.split('/').pop()!;

        const docDetalle = this.docDetalleRepo.create({
            ticketDetalleId,
            nombre: actualSavedName,
            fechaCreacion: new Date(),
            estado: 1
        });

        return this.docDetalleRepo.save(docDetalle);
    }

    /**
     * Attach a document to a Ticket Closing
     */
    async attachToTicketClosing(ticketId: number, file: Express.Multer.File): Promise<DocumentoCierre> {
        const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
        if (!ticket) throw new NotFoundException(`Ticket ${ticketId} not found`);

        const fileName = await this.storageService.save(file, `documentos/${ticketId}`);
        const actualSavedName = fileName.split('/').pop()!;

        const docCierre = this.docCierreRepo.create({
            ticketId,
            nombre: actualSavedName,
            fechaCreacion: new Date(),
            estado: 1
        });

        return this.docCierreRepo.save(docCierre);
    }

    /**
     * Download a file by type and ID
     * @param type 'ticket' | 'detail' | 'closing'
     * @param id ID of the document entity (not the ticket)
     */
    async scanAndDownload(type: 'ticket' | 'detail' | 'closing', id: number): Promise<{ stream: StreamableFile, filename: string, mimeType: string }> {
        let filename: string;
        let ticketId: number;

        if (type === 'ticket') {
            const doc = await this.documentoRepo.findOne({ where: { id } });
            if (!doc) throw new NotFoundException('Document not found');
            filename = doc.nombre;
            ticketId = doc.ticketId;
        } else if (type === 'detail') {
            const doc = await this.docDetalleRepo.findOne({ where: { id }, relations: ['ticketDetalle'] });
            if (!doc) throw new NotFoundException('Document not found');
            filename = doc.nombre;
            ticketId = doc.ticketDetalle.ticketId;
        } else {
            const doc = await this.docCierreRepo.findOne({ where: { id } });
            if (!doc) throw new NotFoundException('Document not found');
            filename = doc.nombre;
            ticketId = doc.ticketId;
        }

        const relativePath = `documentos/${ticketId}/${filename}`;

        // Mime type detection is simple for now, or just 'application/octet-stream'
        const stream = await this.storageService.getStream(relativePath);

        return {
            stream,
            filename,
            mimeType: 'application/octet-stream' // TODO: Detect mime type if needed
        };
    }

    /**
     * Download the Master PDF (Accumulative) for a ticket
     */
    async getMasterPdf(ticketId: number): Promise<{ stream: StreamableFile, filename: string, mimeType: string }> {
        const filename = `ticket_${ticketId}.pdf`;
        const relativePath = `documentos/${ticketId}/${filename}`;

        try {
            const stream = await this.storageService.getStream(relativePath);
            return {
                stream,
                filename,
                mimeType: 'application/pdf'
            };
        } catch (e) {
            throw new NotFoundException(`No PDF generated yet for Ticket ${ticketId}`);
        }
    }

    /**
     * Download a Template PDF by filename
     */
    async getTemplate(filename: string): Promise<{ stream: StreamableFile, filename: string, mimeType: string }> {
        // Validation basic
        if (filename.includes('..') || filename.includes('/')) throw new BadRequestException('Invalid filename');

        const relativePath = `document/formato/${filename}`;
        const stream = await this.storageService.getStream(relativePath);

        return {
            stream,
            filename,
            mimeType: 'application/pdf'
        };
    }
}
