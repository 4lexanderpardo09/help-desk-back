import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { WorkflowEngineService } from '../services/workflow-engine.service';
import { TransitionTicketDto } from '../dto/workflow-transition.dto';
import { JwtAuthGuard } from 'src/modules/auth/jwt.guard';
import { PoliciesGuard } from '../../../common/guards/policies.guard';
import { CheckPolicies } from 'src/modules/auth/decorators/check-policies.decorator';
import { AppAbility } from '../../auth/abilities/ability.factory';

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
}
