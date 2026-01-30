import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { PoliciesGuard } from '../../../common/guards/policies.guard';
import { CheckPolicies } from '../../auth/decorators/check-policies.decorator';
import { AppAbility } from '../../auth/abilities/ability.factory';
import { RutasService } from '../services/rutas.service';
import { CreateRutaDto } from '../dto/create-ruta.dto';
import { UpdateRutaDto } from '../dto/update-ruta.dto';
import { ApiQueryDto } from '../../../common/dto/api-query.dto';

@ApiTags('Workflows Routes Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('workflows/routes')
export class RutasController {
    constructor(private readonly rutasService: RutasService) { }

    @Get()
    @ApiOperation({ summary: 'Listar rutas (paginado)', description: 'Permite filtrar por flujo (filter[flujo.id]).' })
    @ApiQuery({ name: 'included', required: false, description: 'Relaciones a incluir (ej: flujo, rutaPasos)' })
    @ApiQuery({ name: 'filter[flujo.id]', required: false, description: 'Filtrar por ID del Flujo' })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'page', required: false })
    @ApiResponse({ status: 200, description: 'Lista de rutas ordenada' })
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Workflow'))
    async list(@Query() query: ApiQueryDto) {
        return this.rutasService.list({
            limit: query.limit,
            page: query.page,
            included: query.included,
            filter: query.filter,
        });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener ruta por ID' })
    @ApiParam({ name: 'id', description: 'ID de la ruta' })
    @ApiQuery({ name: 'included', required: false, description: 'Relaciones a incluir' })
    @ApiResponse({ status: 200, description: 'Ruta encontrada' })
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Workflow'))
    async show(@Param('id', ParseIntPipe) id: number, @Query() query: ApiQueryDto) {
        return this.rutasService.show(id, { included: query.included });
    }

    @Post()
    @ApiOperation({ summary: 'Crear nueva ruta' })
    @ApiResponse({ status: 201, description: 'Ruta creada' })
    @CheckPolicies((ability: AppAbility) => ability.can('create', 'Workflow'))
    async create(@Body() dto: CreateRutaDto) {
        return this.rutasService.create(dto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Actualizar ruta' })
    @ApiResponse({ status: 200, description: 'Ruta actualizada' })
    @CheckPolicies((ability: AppAbility) => ability.can('update', 'Workflow'))
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRutaDto) {
        return this.rutasService.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar ruta (Soft Delete)' })
    @ApiResponse({ status: 200, description: 'Ruta eliminada' })
    @CheckPolicies((ability: AppAbility) => ability.can('delete', 'Workflow'))
    async delete(@Param('id', ParseIntPipe) id: number) {
        return this.rutasService.delete(id);
    }
}
