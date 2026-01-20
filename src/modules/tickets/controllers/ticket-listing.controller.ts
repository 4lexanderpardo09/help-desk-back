import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { TicketListingService } from '../services/ticket-listing.service';
import { TicketFilterDto } from '../dto/ticket-filter.dto';
import { TicketListResponseDto } from '../dto/ticket-list-item.dto';
import { JwtAuthGuard } from 'src/modules/auth/jwt.guard';
import { PoliciesGuard } from '../../../common/guards/policies.guard';
import { CheckPolicies } from 'src/modules/auth/decorators/check-policies.decorator';
import type { AppAbility } from '../../auth/abilities/ability.factory';
import { User } from '../../auth/decorators/user.decorator';
import { CaslAbility } from '../../auth/decorators/casl-ability.decorator';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
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

    @Get()
    @ApiOperation({ summary: 'Listado unificado de tickets con scope dinámico', description: 'Endpoint maestro que adapta la respuesta según permisos y parámetro view' })
    @ApiResponse({ status: 200, type: TicketListResponseDto })
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Ticket'))
    async list(
        @User() user: JwtPayload,
        @Query() filters: TicketFilterDto,
        @CaslAbility() ability: AppAbility
    ) {
        return this.ticketListingService.list(user, filters, ability);
    }

}
