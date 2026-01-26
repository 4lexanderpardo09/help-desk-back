import { Body, Controller, Post, UseGuards, Req, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { WorkflowEngineService } from '../services/workflow-engine.service';
import { TransitionTicketDto } from '../dto/workflow-transition.dto';
import { CheckStartFlowResponseDto } from '../dto/start-flow-check.dto';
import { CheckNextStepResponseDto } from '../dto/check-next-step.dto';
import { JwtAuthGuard } from 'src/modules/auth/jwt.guard';
import { PoliciesGuard } from '../../../common/guards/policies.guard';
import { CheckPolicies } from 'src/modules/auth/decorators/check-policies.decorator';
import { AppAbility } from '../../auth/abilities/ability.factory';
import { Ticket } from '../../tickets/entities/ticket.entity';

@ApiTags('Workflows Engine')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('workflows')
export class WorkflowController {
    constructor(private readonly workflowService: WorkflowEngineService) { }

    @Post('transition')
    @ApiOperation({ summary: 'Ejecutar transición de paso de un ticket' })
    @ApiResponse({ status: 200, description: 'Transición exitosa, retorna el ticket actualizado', type: Ticket })
    @ApiResponse({ status: 404, description: 'Ticket no encontrado' })
    @ApiResponse({ status: 400, description: 'Transición inválida o paso no encontrado' })
    @CheckPolicies((ability: AppAbility) => ability.can('update', 'Ticket'))
    async transition(@Body() dto: TransitionTicketDto, @Req() req: any) {
        // Force actor to be the logged in user
        dto.actorId = req.user.id;
        return this.workflowService.transitionStep(dto);
    }

    /**
     * Checks if the start of the flow requires manual user selection.
     * @param subcategoriaId - ID of the subcategory.
     */
    @Get('check-start-flow/:subcategoriaId')
    @ApiOperation({ summary: 'Verificar si el inicio de flujo requiere selección manual' })
    @ApiResponse({ status: 200, description: 'Retorna requerimientos y candidatos', type: CheckStartFlowResponseDto })
    @CheckPolicies((ability: AppAbility) => ability.can('create', 'Ticket'))
    async checkStartFlow(@Param('subcategoriaId') subcategoriaId: number) {
        return this.workflowService.checkStartFlow(Number(subcategoriaId));
    }

    /**
     * Checks the next step for a ticket and determines if manual selection is required.
     * @param ticketId - The ID of the ticket.
     */
    @Get('check-next-step/:ticketId')
    @ApiOperation({ summary: 'Verificar siguiente paso y candidatos' })
    @ApiResponse({ status: 200, description: 'Retorna requerimientos y candidatos', type: CheckNextStepResponseDto })
    @CheckPolicies((ability: AppAbility) => ability.can('update', 'Ticket'))
    async checkNextStep(@Param('ticketId') ticketId: number) {
        return this.workflowService.checkNextStep(Number(ticketId));
    }

    /**
     * Approves a ticket flow (used by Bosses/Approvers).
     * @param ticketId - The ID of the ticket.
     */
    @Post('approve-flow/:ticketId')
    @ApiOperation({ summary: 'Aprobar flujo (Jefe/Aprobador)' })
    @ApiResponse({ status: 200, description: 'Aprobación exitosa' })
    @ApiResponse({ status: 403, description: 'No es el aprobador asignado' })
    @CheckPolicies((ability: AppAbility) => ability.can('update', 'Ticket'))
    async approveFlow(@Param('ticketId') ticketId: number, @Req() req: any) {
        await this.workflowService.approveFlow(Number(ticketId), req.user.id);
        return { message: 'Flujo aprobado correctamente' };
    }
}
