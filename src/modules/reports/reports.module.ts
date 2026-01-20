import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { StatisticsController } from './statistics.controller';
import { ReportsService } from './reports.service';
import { TicketStatisticsService } from './services/ticket-statistics.service';
import { Consulta } from './entities/consulta.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { TicketAsignacionHistorico } from '../tickets/entities/ticket-asignacion-historico.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Consulta,
            Ticket,
            TicketAsignacionHistorico
        ]),
        AuthModule,
    ],
    controllers: [
        ReportsController,
        StatisticsController
    ],
    providers: [
        ReportsService,
        TicketStatisticsService
    ],
    exports: [ReportsService, TicketStatisticsService, TypeOrmModule],
})
export class ReportsModule { }
