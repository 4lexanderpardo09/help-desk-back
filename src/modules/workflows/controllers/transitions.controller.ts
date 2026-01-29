import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { PoliciesGuard } from '../../../common/guards/policies.guard';
import { CheckPolicies } from '../../auth/decorators/check-policies.decorator';
import { AppAbility } from '../../auth/abilities/ability.factory';
import { TransitionsService } from '../services/transitions.service';
import { CreateTransitionDto } from '../dto/create-transition.dto';
import { UpdateTransitionDto } from '../dto/update-transition.dto';
import { ApiQueryDto } from '../../../common/dto/api-query.dto';

@ApiTags('Workflows Transitions Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('workflows/transitions')
export class TransitionsController {
    constructor(private readonly transitionsService: TransitionsService) { }

    @Get()
    @ApiOperation({ summary: 'Listar transiciones de flujos (paginado)', description: 'Permite filtrar por flujo, paso origen/destino, etc.' })
    @ApiQuery({ name: 'included', required: false, description: 'Relaciones a incluir (ej: pasoOrigen, pasoDestino)' })
    @ApiQuery({ name: 'filter[pasoOrigen.id]', required: false, description: 'Filtrar por ID del Paso Origen (Relation)' })
    @ApiQuery({ name: 'filter[pasoOrigenId]', required: false, description: 'Filtrar por ID del Paso Origen (Column)' })
    @ApiQuery({ name: 'filter[pasoDestino.id]', required: false, description: 'Filtrar por ID del Paso Destino (Relation)' })
    @ApiQuery({ name: 'filter[pasoDestinoId]', required: false, description: 'Filtrar por ID del Paso Destino (Column)' })
    @ApiQuery({ name: 'filter[rutaId]', required: false, description: 'Filtrar por ID de la Ruta' })
    @ApiQuery({ name: 'filter[pasoOrigen.flujo.id]', required: false, description: 'Filtrar por ID del Flujo' })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'page', required: false })
    @ApiResponse({ status: 200, description: 'Lista de transiciones ordenada' })
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'all'))
    async list(@Query() query: ApiQueryDto) {
        return this.transitionsService.list({
            limit: query.limit,
            page: query.page,
            included: query.included,
            filter: query.filter,
        });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener transición por ID' })
    @ApiParam({ name: 'id', description: 'ID de la transición' })
    @ApiQuery({ name: 'included', required: false, description: 'Relaciones a incluir' })
    @ApiResponse({ status: 200, description: 'Transición encontrada' })
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'all'))
    async show(@Param('id') id: number, @Query() query: ApiQueryDto) {
        return this.transitionsService.show(Number(id), { included: query.included });
    }

    @Post()
    @ApiOperation({ summary: 'Crear nueva transición' })
    @ApiResponse({ status: 201, description: 'Transición creada' })
    @CheckPolicies((ability: AppAbility) => ability.can('create', 'all'))
    async create(@Body() dto: CreateTransitionDto) {
        return this.transitionsService.create(dto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Actualizar transición' })
    @ApiResponse({ status: 200, description: 'Transición actualizada' })
    @CheckPolicies((ability: AppAbility) => ability.can('update', 'all'))
    async update(@Param('id') id: number, @Body() dto: UpdateTransitionDto) {
        return this.transitionsService.update(Number(id), dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar transición (Soft Delete)' })
    @ApiResponse({ status: 200, description: 'Transición eliminada' })
    @CheckPolicies((ability: AppAbility) => ability.can('delete', 'all'))
    async delete(@Param('id') id: number) {
        return this.transitionsService.delete(Number(id));
    }
}
