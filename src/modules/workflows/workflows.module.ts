import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { WorkflowController } from './controllers/workflow.controller';
import { WorkflowEngineService } from './services/workflow-engine.service';
import { SlaService } from './services/sla.service';
import { SlaSchedulerService } from './services/sla-scheduler.service';
import { PasoFlujo } from './entities/paso-flujo.entity';
import { Flujo } from './entities/flujo.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { TicketAsignacionHistorico } from '../tickets/entities/ticket-asignacion-historico.entity';
import { User } from '../users/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { AssignmentModule } from '../assignments/assignment.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { FlujoTransicion } from './entities/flujo-transicion.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Flujo,
            PasoFlujo,
            FlujoTransicion,
            Ticket,
            TicketAsignacionHistorico,
            User
        ]),
        AuthModule,
        AuthModule,
        AssignmentModule,
        NotificationsModule,
        ScheduleModule.forRoot()
    ],
    controllers: [WorkflowController],
    providers: [WorkflowEngineService, SlaService, SlaSchedulerService],
    exports: [WorkflowEngineService]
})
export class WorkflowsModule { }
