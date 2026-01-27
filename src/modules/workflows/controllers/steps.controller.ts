import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { PoliciesGuard } from '../../../common/guards/policies.guard';
import { CheckPolicies } from '../../auth/decorators/check-policies.decorator';
import { AppAbility } from '../../auth/abilities/ability.factory';
import { StepsService } from '../services/steps.service';
import { CreatePasoFlujoDto } from '../dto/create-paso-flujo.dto';
import { UpdatePasoFlujoDto } from '../dto/update-paso-flujo.dto';
import { ApiQueryDto } from '../../../common/dto/api-query.dto';

@ApiTags('Workflows Steps Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('workflows/steps')
export class StepsController {
    constructor(private readonly stepsService: StepsService) { }

    @Get()
    @ApiOperation({ summary: 'Listar pasos de flujo (paginado)', description: 'Permite filtrar por flujo (filter[flujo.id]), nombre, etc.' })
    @ApiQuery({ name: 'included', required: false, description: 'Relaciones a incluir (ej: flujo, cargoAsignado)' })
    @ApiQuery({ name: 'filter[flujo.id]', required: false, description: 'Filtrar por ID del Flujo' })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'page', required: false })
    @ApiResponse({ status: 200, description: 'Lista de pasos ordenada' })
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'all'))
    async list(@Query() query: ApiQueryDto) {
        return this.stepsService.list({
            limit: query.limit,
            page: query.page,
            included: query.included,
            filter: query.filter,
        });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener paso por ID' })
    @ApiParam({ name: 'id', description: 'ID del paso' })
    @ApiQuery({ name: 'included', required: false, description: 'Relaciones a incluir' })
    @ApiResponse({ status: 200, description: 'Paso encontrado' })
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'all'))
    async show(@Param('id', ParseIntPipe) id: number, @Query() query: ApiQueryDto) {
        return this.stepsService.show(id, { included: query.included });
    }

    @Post()
    @ApiOperation({ summary: 'Crear nuevo paso de flujo' })
    @ApiResponse({ status: 201, description: 'Paso creado' })
    @CheckPolicies((ability: AppAbility) => ability.can('create', 'all'))
    async create(@Body() dto: CreatePasoFlujoDto) {
        return this.stepsService.create(dto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Actualizar paso de flujo' })
    @ApiResponse({ status: 200, description: 'Paso actualizado' })
    @CheckPolicies((ability: AppAbility) => ability.can('update', 'all'))
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePasoFlujoDto) {
        return this.stepsService.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar paso de flujo (Soft Delete)' })
    @ApiResponse({ status: 200, description: 'Paso eliminado' })
    @CheckPolicies((ability: AppAbility) => ability.can('delete', 'all'))
    async delete(@Param('id', ParseIntPipe) id: number) {
        return this.stepsService.delete(id);
    }
}
