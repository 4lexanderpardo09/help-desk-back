import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketListingController } from './controllers/ticket-listing.controller';
import { TicketHistoryController } from './controllers/ticket-history.controller';
import { TicketController } from './controllers/ticket.controller';
import { TicketListingService } from './services/ticket-listing.service';
import { TicketHistoryService } from './services/ticket-history.service';
import { TicketService } from './services/ticket.service';
import { Ticket } from './entities/ticket.entity';
import { TicketEtiqueta } from './entities/ticket-etiqueta.entity';
import { TicketDetalle } from './entities/ticket-detalle.entity';
import { TicketAsignacionHistorico } from './entities/ticket-asignacion-historico.entity';
import { Documento } from '../documents/entities/documento.entity';
import { User } from '../users/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { AssignmentModule } from '../assignments/assignment.module';
import { UsersModule } from '../users/users.module'; // Assuming UsersModule is needed for User Validation

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Ticket,
            TicketDetalle,
            TicketAsignacionHistorico,
            TicketEtiqueta,
            Documento,
            User
        ]),
        AuthModule,
        UsersModule, // For User Validation if needed
        AssignmentModule // Needed for TicketService
    ],
    controllers: [
        TicketListingController,
        TicketHistoryController,
        TicketController
    ],
    providers: [
        TicketService,
        TicketListingService,
        TicketHistoryService
    ],
    exports: [TicketService]
})
export class TicketsModule { }
