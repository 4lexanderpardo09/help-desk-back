import { Controller, Post, Get, Param, UploadedFile, UseInterceptors, UseGuards, Req, Res, BadRequestException, NotFoundException, StreamableFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DocumentsService } from './services/documents.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PoliciesGuard } from '../../common/guards/policies.guard';
import { CheckPolicies } from '../auth/decorators/check-policies.decorator';
import { AppAbility } from '../auth/abilities/ability.factory';
import { Ticket } from '../tickets/entities/ticket.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Response } from 'express';
import 'multer';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('documents')
export class DocumentsController {
    constructor(
        private readonly documentsService: DocumentsService,
        @InjectRepository(Ticket)
        private readonly ticketRepo: Repository<Ticket>,
    ) { }

    @Post('ticket/:ticketId')
    @ApiOperation({ summary: 'Subir adjunto a un Ticket' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    @CheckPolicies((ability: AppAbility) => ability.can('update', 'Ticket')) // Broad check
    async uploadToTicket(
        @Param('ticketId') ticketId: number,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) throw new BadRequestException('File is required');
        // TODO: Strict instance check if user can edit THIS ticket
        return this.documentsService.attachToTicket(ticketId, file);
    }

    @Post('comment/:detailId')
    @ApiOperation({ summary: 'Subir adjunto a un Comentario (Ticket Detail)' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    @CheckPolicies((ability: AppAbility) => ability.can('update', 'Ticket'))
    async uploadToDetail(
        @Param('detailId') detailId: number,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) throw new BadRequestException('File is required');
        return this.documentsService.attachToTicketDetail(detailId, file);
    }

    @Post('closing/:ticketId')
    @ApiOperation({ summary: 'Subir adjunto al Cerrar ticket' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    @CheckPolicies((ability: AppAbility) => ability.can('update', 'Ticket'))
    async uploadToClosing(
        @Param('ticketId') ticketId: number,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) throw new BadRequestException('File is required');
        return this.documentsService.attachToTicketClosing(ticketId, file);
    }

    @Get(':type/:id/download')
    @ApiOperation({ summary: 'Descargar documento de forma segura' })
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Ticket'))
    async download(
        @Param('type') type: string,
        @Param('id') id: number,
        @Res({ passthrough: true }) res: Response,
    ): Promise<StreamableFile> {
        if (!['ticket', 'detail', 'closing'].includes(type)) {
            throw new BadRequestException('Invalid document type');
        }

        const { stream, filename, mimeType } = await this.documentsService.scanAndDownload(type as any, id);

        res.set({
            'Content-Type': mimeType,
            'Content-Disposition': `attachment; filename="${filename}"`,
        });

        return stream;
    }

    @Get('ticket/:ticketId/master-pdf')
    @ApiOperation({ summary: 'Descargar PDF Maestro (Acumulativo)' })
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Ticket'))
    async downloadMasterPdf(
        @Param('ticketId') ticketId: number,
        @Res({ passthrough: true }) res: Response,
    ): Promise<StreamableFile> {
        const { stream, filename, mimeType } = await this.documentsService.getMasterPdf(ticketId);

        res.set({
            'Content-Type': mimeType,
            'Content-Disposition': `inline; filename="${filename}"`,
        });

        return stream;
    }
}
