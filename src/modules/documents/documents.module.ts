import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsService } from './services/documents.service';
import { StorageService } from './services/storage.service';
import { DocumentsController } from './documents.controller';
import { Documento } from './entities/documento.entity';
import { DocumentoDetalle } from './entities/documento-detalle.entity';
import { DocumentoCierre } from './entities/documento-cierre.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { TicketDetalle } from '../tickets/entities/ticket-detalle.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Documento,
            DocumentoDetalle,
            DocumentoCierre,
            Ticket,
            TicketDetalle
        ]),
        AuthModule // Needed for CASL PoliciesGuard
    ],
    controllers: [DocumentsController],
    providers: [DocumentsService, StorageService],
    exports: [DocumentsService, StorageService] // Export StorageService just in case
})
export class DocumentsModule { }
