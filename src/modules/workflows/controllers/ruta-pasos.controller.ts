import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { PoliciesGuard } from '../../../common/guards/policies.guard';
import { CheckPolicies } from '../../auth/decorators/check-policies.decorator';
import { AppAbility } from '../../auth/abilities/ability.factory';
import { RutaPasosService } from '../services/ruta-pasos.service';
import { CreateRutaPasoDto } from '../dto/create-ruta-paso.dto';
import { UpdateRutaPasoDto } from '../dto/update-ruta-paso.dto';
import { ApiQueryDto } from '../../../common/dto/api-query.dto';

@ApiTags('Workflows Route Steps Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('workflows/route-steps')
export class RutaPasosController {
    constructor(private readonly rutaPasosService: RutaPasosService) { }

    @Get()
    @ApiOperation({ summary: 'Listar pasos de rutas (paginado)', description: 'Permite filtrar por ruta (filter[ruta.id]) y ordenar.' })
    @ApiQuery({ name: 'included', required: false, description: 'Relaciones a incluir (ej: ruta, paso)' })
    @ApiQuery({ name: 'filter[ruta.id]', required: false, description: 'Filtrar por ID de la Ruta' })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'sort', required: false, description: 'Ordenamiento (ej: orden:ASC)' })
    @ApiResponse({ status: 200, description: 'Lista de relaciones ruta-paso ordenada' })
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'all'))
    async list(@Query() query: ApiQueryDto) {
        return this.rutaPasosService.list({
            limit: query.limit,
            page: query.page,
            included: query.included,
            filter: query.filter,
            sort: query.sort
        });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener relación ruta-paso por ID' })
    @ApiParam({ name: 'id', description: 'ID de la relación ruta-paso' })
    @ApiQuery({ name: 'included', required: false, description: 'Relaciones a incluir' })
    @ApiResponse({ status: 200, description: 'Relación encontrada' })
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'all'))
    async show(@Param('id', ParseIntPipe) id: number, @Query() query: ApiQueryDto) {
        return this.rutaPasosService.show(id, { included: query.included });
    }

    @Post()
    @ApiOperation({ summary: 'Vincular paso a una ruta' })
    @ApiResponse({ status: 201, description: 'Paso vinculado a la ruta' })
    @CheckPolicies((ability: AppAbility) => ability.can('create', 'all'))
    async create(@Body() dto: CreateRutaPasoDto) {
        return this.rutaPasosService.create(dto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Actualizar vínculo (# orden)' })
    @ApiResponse({ status: 200, description: 'Vínculo actualizado' })
    @CheckPolicies((ability: AppAbility) => ability.can('update', 'all'))
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRutaPasoDto) {
        return this.rutaPasosService.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Desvincular paso de la ruta (Soft Delete)' })
    @ApiResponse({ status: 200, description: 'Vínculo eliminado' })
    @CheckPolicies((ability: AppAbility) => ability.can('delete', 'all'))
    async delete(@Param('id', ParseIntPipe) id: number) {
        return this.rutaPasosService.delete(id);
    }
}
