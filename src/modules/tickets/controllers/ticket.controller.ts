import { Body, Controller, Post, Get, Param, Put, UseGuards, Req, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { TicketService } from '../services/ticket.service';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { UpdateTicketDto } from '../dto/update-ticket.dto';
import { RegisterErrorEventDto } from '../dto/register-error-event.dto';
import { CreateTicketNovedadDto } from '../dto/create-ticket-novedad.dto';
import { JwtAuthGuard } from 'src/modules/auth/jwt.guard';
import { PoliciesGuard } from '../../../common/guards/policies.guard';
import { CheckPolicies } from 'src/modules/auth/decorators/check-policies.decorator';
import { AppAbility } from '../../auth/abilities/ability.factory';
import { Ticket } from '../entities/ticket.entity';

@ApiTags('Tickets Orchestrator')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('tickets')
export class TicketController {
    constructor(private readonly ticketService: TicketService) { }

    @Post()
    @ApiOperation({ summary: 'Crear un nuevo ticket' })
    @ApiResponse({ status: 201, description: 'Ticket creado exitosamente e iniciado en el flujo de trabajo', type: Ticket })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
    @ApiResponse({ status: 400, description: 'Error al iniciar flujo (sin subcategoría)' })
    @CheckPolicies((ability: AppAbility) => ability.can('create', 'Ticket'))
    async create(@Body() dto: CreateTicketDto, @Req() req: any) {
        dto.usuarioId = req.user.usu_id;
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
    async findOne(@Param('id') id: string, @Req() req: any) {
        return this.ticketService.findOne(+id, req.user?.usu_id);
    }

    @Get(':id/parallel-tasks')
    @ApiOperation({ summary: 'Obtener tareas paralelas de un ticket' })
    @ApiResponse({ status: 200, description: 'Lista de tareas paralelas con estado' })
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Ticket'))
    async getParallelTasks(@Param('id') id: string) {
        return this.ticketService.getParallelTasks(+id);
    }

    @Post('admin/migrate-assignments')
    @ApiOperation({ summary: 'Migrar asignaciones legacy a nueva tabla' })
    @CheckPolicies((ability: AppAbility) => ability.can('manage', 'Migration')) // Only Admins
    async migrateAssignments() {
        return this.ticketService.migrateLegacyAssignments();
    }

    @Post(':id/events')
    @ApiOperation({ summary: 'Registrar evento de error en ticket' })
    @ApiResponse({ status: 201, description: 'Evento registrado' })
    @CheckPolicies((ability: AppAbility) => ability.can('update', 'Ticket'))
    async registerEvent(@Param('id') id: string, @Body() dto: RegisterErrorEventDto, @Req() req: any) {
        return this.ticketService.registerErrorEvent(+id, req.user.usu_id, dto);
    }

    @Post(':id/novelties')
    @ApiOperation({ summary: 'Crear una novedad para el ticket (Pausar)' })
    @ApiResponse({ status: 201, description: 'Novedad creada' })
    @CheckPolicies((ability: AppAbility) => ability.can('update', 'Ticket'))
    async createNovelty(@Param('id') id: string, @Body() dto: CreateTicketNovedadDto, @Req() req: any) {
        return this.ticketService.createNovelty(+id, req.user.usu_id, dto);
    }

    @Put(':id/novelties/resolve')
    @ApiOperation({ summary: 'Resolver novedad activa del ticket (Reanudar)' })
    @ApiResponse({ status: 200, description: 'Novedad resuelta' })
    @CheckPolicies((ability: AppAbility) => ability.can('update', 'Ticket'))
    async resolveNovelty(@Param('id') id: string, @Req() req: any) {
        return this.ticketService.resolveNovelty(+id, req.user.usu_id);
    }

    @Post(':id/close')
    @ApiOperation({ summary: 'Cerrar ticket manualmente (Paso Final)' })
    @ApiResponse({ status: 200, description: 'Ticket cerrado exitosamente' })
    @CheckPolicies((ability: AppAbility) => ability.can('update', 'Ticket'))
    async close(@Param('id') id: string, @Body() dto: import('../dto/close-ticket.dto').CloseTicketDto, @Req() req: any) {
        return this.ticketService.closeTicket(+id, req.user.usu_id, dto);
    }

    @Post(':id/tags')
    @ApiOperation({ summary: 'Asignar etiqueta a un ticket' })
    @ApiResponse({ status: 201, description: 'Etiqueta asignada' })
    @CheckPolicies((ability: AppAbility) => ability.can('update', 'Ticket'))
    async addTag(@Param('id') id: string, @Body() body: { tagId: number }, @Req() req: any) {
        return this.ticketService.addTag(+id, body.tagId, req.user.usu_id);
    }

    @Delete(':id/tags/:tagId')
    @ApiOperation({ summary: 'Remover etiqueta de un ticket' })
    @ApiResponse({ status: 200, description: 'Etiqueta removida' })
    @CheckPolicies((ability: AppAbility) => ability.can('update', 'Ticket'))
    async removeTag(@Param('id') id: string, @Param('tagId') tagId: string) {
        return this.ticketService.removeTag(+id, +tagId);
    }
}
