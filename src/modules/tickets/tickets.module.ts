import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
import { TicketListingController } from './controllers/ticket-listing.controller';
import { TicketHistoryController } from './controllers/ticket-history.controller';
import { TicketController } from './controllers/ticket.controller';
import { TicketErrorController } from './controllers/ticket-error.controller';

// Services
import { TicketListingService } from './services/ticket-listing.service';
import { TicketHistoryService } from './services/ticket-history.service';
import { TicketService } from './services/ticket.service';
import { TicketErrorService } from './services/ticket-error.service';

// Entities
import { Ticket } from './entities/ticket.entity';
import { TicketEtiqueta } from './entities/ticket-etiqueta.entity';
import { TicketDetalle } from './entities/ticket-detalle.entity';
import { TicketAsignacionHistorico } from './entities/ticket-asignacion-historico.entity';
import { TicketError } from './entities/ticket-error.entity';
import { TicketCampoValor } from './entities/ticket-campo-valor.entity';

// External Entities
import { Documento } from '../documents/entities/documento.entity';
import { DocumentoFlujo } from '../documents/entities/documento-flujo.entity';
import { User } from '../users/entities/user.entity';

// Modules
import { AuthModule } from '../auth/auth.module';
import { AssignmentModule } from '../assignments/assignment.module';
import { UsersModule } from '../users/users.module';
import { WorkflowsModule } from '../workflows/workflows.module';
import { TemplatesModule } from '../templates/templates.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DocumentsModule } from '../documents/documents.module';
import { ErrorTypesModule } from '../error-types/error-types.module';
import { ReglasMapeoModule } from '../rules/reglas-mapeo.module';
import { TicketAsignado } from './entities/ticket-asignado.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Ticket,
            TicketAsignado,
            TicketDetalle,
            TicketAsignacionHistorico,
            TicketEtiqueta,
            TicketCampoValor,
            TicketError,
            Documento,
            DocumentoFlujo,
            User
        ]),
        ReglasMapeoModule,
        AuthModule,
        AssignmentModule,
        WorkflowsModule,
        TemplatesModule,
        NotificationsModule,
        DocumentsModule,
        ErrorTypesModule,
        forwardRef(() => UsersModule)
    ],
    controllers: [
        TicketListingController,
        TicketHistoryController,
        TicketController,
        TicketErrorController
    ],
    providers: [
        TicketService,
        TicketListingService,
        TicketHistoryService,
        TicketErrorService
    ],
    exports: [TicketService, TicketListingService, TicketHistoryService],
})
export class TicketsModule { }
