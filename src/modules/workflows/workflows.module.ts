import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { TemplatesModule } from '../templates/templates.module';
import { DocumentsModule } from '../documents/documents.module';
import { WorkflowController } from './controllers/workflow.controller';
import { WorkflowEngineService } from './services/workflow-engine.service';
import { SlaService } from './services/sla.service';
import { SlaSchedulerService } from './services/sla-scheduler.service';
import { SignatureStampingService } from './services/signature-stamping.service';
import { PasoFlujo } from './entities/paso-flujo.entity';
import { Flujo } from './entities/flujo.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { TicketAsignado } from '../tickets/entities/ticket-asignado.entity';
import { TicketAsignacionHistorico } from '../tickets/entities/ticket-asignacion-historico.entity';
import { User } from '../users/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { AssignmentModule } from '../assignments/assignment.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { FlujoTransicion } from './entities/flujo-transicion.entity';
import { PasoFlujoFirma } from './entities/paso-flujo-firma.entity';
import { TicketCampoValor } from '../tickets/entities/ticket-campo-valor.entity';
import { StepsController } from './controllers/steps.controller';
import { StepsService } from './services/steps.service';

import { FlowsController } from './controllers/flows.controller';
import { FlowsService } from './services/flows.service';

import { TransitionsController } from './controllers/transitions.controller';
import { TransitionsService } from './services/transitions.service';
import { RutasController } from './controllers/rutas.controller';
import { RutasService } from './services/rutas.service';
import { RutaPasosController } from './controllers/ruta-pasos.controller';
import { RutaPasosService } from './services/ruta-pasos.service';
import { Ruta } from './entities/ruta.entity';
import { RutaPaso } from './entities/ruta-paso.entity';
import { TicketParalelo } from '../tickets/entities/ticket-paralelo.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Flujo,
            PasoFlujo,
            FlujoTransicion,
            PasoFlujoFirma,
            Ticket,
            TicketAsignacionHistorico,
            Ticket,
            TicketAsignacionHistorico,
            User,
            TicketCampoValor,
            Ruta,
            TicketCampoValor,
            Ruta,
            RutaPaso,
            TicketParalelo,
            TicketAsignado
        ]),
        AuthModule,
        AuthModule,
        AssignmentModule,
        NotificationsModule,
        ScheduleModule.forRoot(),
        TemplatesModule,
        DocumentsModule,
    ],
    controllers: [WorkflowController, StepsController, TransitionsController, RutasController, RutaPasosController, FlowsController],
    providers: [WorkflowEngineService, SlaService, SlaSchedulerService, SignatureStampingService, StepsService, FlowsService, TransitionsService, RutasService, RutaPasosService],
    exports: [WorkflowEngineService, SignatureStampingService, StepsService, FlowsService]
})
export class WorkflowsModule { }
