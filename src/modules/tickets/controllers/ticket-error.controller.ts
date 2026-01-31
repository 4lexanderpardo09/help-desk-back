import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { PoliciesGuard } from '../../../common/guards/policies.guard';
import { TicketErrorService } from '../services/ticket-error.service';
import { CheckPolicies } from '../../auth/decorators/check-policies.decorator';
import { AppAbility } from '../../auth/abilities/ability.factory';
import { AuthUser } from '../../auth/interfaces/auth-user.interface';

@ApiTags('Tickets Errors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('tickets/errors')
export class TicketErrorController {
    constructor(private readonly service: TicketErrorService) { }

    @Post()
    @ApiOperation({ summary: 'Reportar un error en un ticket' })
    @CheckPolicies((ability: AppAbility) => ability.can('create', 'Ticket')) // Any active user
    async create(@Body() body: any, @Req() req: any) {
        return this.service.create(body, req.user.usu_id);
    }

    @Get('received')
    @ApiOperation({ summary: 'Errores reportados hacia mí' })
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Ticket'))
    async getReceived(@Req() req: any) {
        return this.service.getReceivedErrors(req.user.usu_id);
    }

    @Get('reported')
    @ApiOperation({ summary: 'Errores que yo reporté' })
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Ticket'))
    async getReported(@Req() req: any) {
        return this.service.getReportedErrors(req.user.usu_id);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Estadísticas de errores por tipo' })
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Ticket')) // Manager/Admin usually
    async getStats() {
        return this.service.getStatistics();
    }
}
