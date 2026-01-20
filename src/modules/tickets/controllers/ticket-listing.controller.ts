import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { TicketListingService } from '../services/ticket-listing.service';
import { TicketFilterDto } from '../dto/ticket-filter.dto';
import { TicketListResponseDto } from '../dto/ticket-list-item.dto';
import { JwtAuthGuard } from 'src/modules/auth/jwt.guard';
import { PoliciesGuard } from '../../../common/guards/policies.guard';
import { CheckPolicies } from 'src/modules/auth/decorators/check-policies.decorator';
import { AppAbility } from '../../auth/abilities/ability.factory';

import { Request } from 'express';

interface RequestWithUser extends Request {
    user: {
        id: number;
        email: string;
        role: string;
    }
}

@ApiTags('Tickets Listing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('tickets/list')
export class TicketListingController {
    constructor(private readonly ticketListingService: TicketListingService) { }

    @Get('user')
    @ApiOperation({ summary: 'Listar mis tickets (creados por mí)' })
    @ApiResponse({ status: 200, type: TicketListResponseDto })
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Ticket'))
    async listByUser(@Req() req: RequestWithUser, @Query() filters: TicketFilterDto) {
        return this.ticketListingService.listTicketsByUser(req.user.id, filters);
    }

    @Get('agent')
    @ApiOperation({ summary: 'Listar tickets asignados a mí (Agente)' })
    @ApiResponse({ status: 200, type: TicketListResponseDto })
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Ticket'))
    // TODO: Add policy check ensuring user is Agent/Support
    async listByAgent(@Req() req: RequestWithUser, @Query() filters: TicketFilterDto) {
        return this.ticketListingService.listTicketsByAgent(req.user.id, filters);
    }

    @Get('all')
    @ApiOperation({ summary: 'Listar todos los tickets (Admin/Supervisor)' })
    @ApiResponse({ status: 200, type: TicketListResponseDto })
    @CheckPolicies((ability: AppAbility) => ability.can('manage', 'Ticket'))
    async listAll(@Query() filters: TicketFilterDto) {
        return this.ticketListingService.listAllTickets(filters);
    }

    @Get('observed')
    @ApiOperation({ summary: 'Listar tickets donde soy observador' })
    @ApiResponse({ status: 200, type: TicketListResponseDto })
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Ticket'))
    async listObserved(@Req() req: RequestWithUser, @Query() filters: TicketFilterDto) {
        return this.ticketListingService.listTicketsObservados(req.user.id, filters);
    }
}
