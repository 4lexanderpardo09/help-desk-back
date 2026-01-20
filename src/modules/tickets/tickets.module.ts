import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketListingController } from './controllers/ticket-listing.controller';
import { TicketListingService } from './services/ticket-listing.service';
import { Ticket } from './entities/ticket.entity';
import { TicketEtiqueta } from './entities/ticket-etiqueta.entity';
import { AuthModule } from '../auth/auth.module'; // For PoliciesGuard

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Ticket,
            TicketEtiqueta
        ]),
        AuthModule
    ],
    controllers: [
        TicketListingController
    ],
    providers: [
        TicketListingService
    ],
    exports: [
        TicketListingService
    ]
})
export class TicketsModule { }
