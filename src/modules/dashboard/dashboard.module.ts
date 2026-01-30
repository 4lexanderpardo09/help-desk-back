import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './services/dashboard/dashboard.service';
import { DashboardController } from './controllers/dashboard/dashboard.controller';
import { Ticket } from '../tickets/entities/ticket.entity';
import { TicketAsignacionHistorico } from '../tickets/entities/ticket-asignacion-historico.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, TicketAsignacionHistorico])],
  providers: [DashboardService],
  controllers: [DashboardController]
})
export class DashboardModule { }
