import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { TicketHistoryService } from '../services/ticket-history.service';
import { TicketTimelineItemDto } from '../dto/ticket-timeline.dto';
import { JwtAuthGuard } from 'src/modules/auth/jwt.guard';
import { PoliciesGuard } from '../../../common/guards/policies.guard';
import { CheckPolicies } from 'src/modules/auth/decorators/check-policies.decorator';
import { AppAbility } from '../../auth/abilities/ability.factory';

@ApiTags('Tickets History')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('tickets')
export class TicketHistoryController {
    constructor(private readonly ticketHistoryService: TicketHistoryService) { }

    @Get(':id/timeline')
    @ApiOperation({ summary: 'Obtener línea de tiempo del ticket (Historial)' })
    @ApiResponse({ status: 200, type: [TicketTimelineItemDto] })
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Ticket'))
    async getTimeline(@Param('id', ParseIntPipe) ticketId: number) {
        return this.ticketHistoryService.getTicketTimeline(ticketId);
    }
}
