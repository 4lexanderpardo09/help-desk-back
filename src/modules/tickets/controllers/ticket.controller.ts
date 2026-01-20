import { Body, Controller, Post, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { TicketService } from '../services/ticket.service';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { UpdateTicketDto } from '../dto/update-ticket.dto';
import { JwtAuthGuard } from 'src/modules/auth/jwt.guard';
import { PoliciesGuard } from '../../../common/guards/policies.guard';
import { CheckPolicies } from 'src/modules/auth/decorators/check-policies.decorator';
import { AppAbility } from '../../auth/abilities/ability.factory';

@ApiTags('Tickets Orchestrator')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('tickets')
export class TicketController {
    constructor(private readonly ticketService: TicketService) { }

    @Post()
    @ApiOperation({ summary: 'Crear un nuevo ticket' })
    @ApiResponse({ status: 201, description: 'Ticket creado exitosamente' })
    @CheckPolicies((ability: AppAbility) => ability.can('create', 'Ticket'))
    async create(@Body() dto: CreateTicketDto) {
        return this.ticketService.create(dto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Actualizar un ticket' })
    @ApiResponse({ status: 200, description: 'Ticket actualizado' })
    @CheckPolicies((ability: AppAbility) => ability.can('update', 'Ticket'))
    async update(@Param('id') id: string, @Body() dto: UpdateTicketDto) {
        return this.ticketService.update(+id, dto);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener detalle de un ticket' })
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Ticket'))
    async findOne(@Param('id') id: string) {
        return this.ticketService.findOne(+id);
    }
}
