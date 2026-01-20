import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowController } from './controllers/workflow.controller';
import { WorkflowEngineService } from './services/workflow-engine.service';
import { PasoFlujo } from './entities/paso-flujo.entity';
import { FlujoTransicion } from './entities/flujo-transicion.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { TicketAsignacionHistorico } from '../tickets/entities/ticket-asignacion-historico.entity';
import { User } from '../users/entities/user.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            PasoFlujo,
            FlujoTransicion,
            Ticket,
            TicketAsignacionHistorico,
            User
        ]),
        AuthModule
    ],
    controllers: [WorkflowController],
    providers: [WorkflowEngineService],
    exports: [WorkflowEngineService]
})
export class WorkflowsModule { }
