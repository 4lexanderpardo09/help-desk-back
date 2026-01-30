import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { PoliciesGuard } from '../../../common/guards/policies.guard';
import { CheckPolicies } from '../../auth/decorators/check-policies.decorator';
import { AppAbility } from '../../auth/abilities/ability.factory';
import { FlowsService } from '../services/flows.service';
import { CreateFlujoDto } from '../dto/create-flujo.dto';
import { UpdateFlujoDto } from '../dto/update-flujo.dto';
import { ApiQueryDto } from '../../../common/dto/api-query.dto';

@ApiTags('Workflows Flows Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('workflows')
export class FlowsController {
    constructor(private readonly flowsService: FlowsService) { }

    @Get()
    @ApiOperation({ summary: 'Listar flujos de trabajo (paginado)', description: 'Soporta filtros y relaciones dinámicas.' })
    @ApiQuery({ name: 'included', required: false, description: 'Relaciones a incluir (ej: subcategoria)' })
    @ApiQuery({ name: 'filter[nombre]', required: false, description: 'Filtrar por nombre' })
    @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados' })
    @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
    @ApiResponse({ status: 200, description: 'Lista de flujos paginada' })
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Workflow'))
    async list(@Query() query: ApiQueryDto) {
        return this.flowsService.list({
            limit: query.limit,
            page: query.page,
            included: query.included,
            filter: query.filter,
        });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener flujo por ID', description: 'Obtiene un flujo específico.' })
    @ApiParam({ name: 'id', description: 'ID del flujo' })
    @ApiQuery({ name: 'included', required: false, description: 'Relaciones a incluir' })
    @ApiResponse({ status: 200, description: 'Flujo encontrado' })
    @ApiResponse({ status: 404, description: 'Flujo no encontrado' })
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Workflow'))
    async show(@Param('id', ParseIntPipe) id: number, @Query() query: ApiQueryDto) {
        return this.flowsService.show(id, {
            included: query.included
        });
    }

    @Post()
    @ApiOperation({ summary: 'Crear nuevo flujo' })
    @ApiResponse({ status: 201, description: 'Flujo creado' })
    @CheckPolicies((ability: AppAbility) => ability.can('create', 'Workflow'))
    async create(@Body() dto: CreateFlujoDto) {
        return this.flowsService.create(dto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Actualizar flujo' })
    @ApiResponse({ status: 200, description: 'Flujo actualizado' })
    @CheckPolicies((ability: AppAbility) => ability.can('update', 'Workflow'))
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFlujoDto) {
        return this.flowsService.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar flujo (Soft Delete)' })
    @ApiResponse({ status: 200, description: 'Flujo eliminado' })
    @CheckPolicies((ability: AppAbility) => ability.can('delete', 'Workflow'))
    async delete(@Param('id', ParseIntPipe) id: number) {
        return this.flowsService.delete(id);
    }
}
