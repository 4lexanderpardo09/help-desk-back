import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    ParseIntPipe,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { RegionsService } from './regions.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PoliciesGuard } from '../../common/guards/policies.guard';
import { CheckPolicies } from '../auth/decorators/check-policies.decorator';
import { AppAbility } from '../auth/abilities/ability.factory';
import { Regional } from './entities/regional.entity';
import { CreateRegionalDto } from './dto/create-regional.dto';
import { UpdateRegionalDto } from './dto/update-regional.dto';
import { ApiQueryDto } from '../../common/dto/api-query.dto';

/**
 * RegionsController
 * 
 * Endpoints REST para gestión de Regionales.
 * Sigue el patrón de UsersController.
 */
@ApiTags('Regions')
@ApiBearerAuth()
@Controller('regions')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class RegionsController {
    constructor(private readonly regionsService: RegionsService) { }

    // === RUTAS SIN PARÁMETROS ===

    /**
     * GET /regions
     * Lista todas las regionales con filtros dinámicos.
     */
    @Get()
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Regional'))
    @ApiOperation({ summary: 'Listar regionales', description: 'Lista regionales con filtros dinámicos.' })
    @ApiQuery({ name: 'included', required: false, description: 'Relaciones: zona, usuarios' })
    @ApiQuery({ name: 'filter[zonaId]', required: false, description: 'Filtrar por zona' })
    @ApiQuery({ name: 'filter[estado]', required: false, description: 'Filtrar por estado' })
    @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados' })
    @ApiQuery({ name: 'page', required: false, description: 'Página' })
    @ApiResponse({ status: 200, description: 'Lista de regionales.' })
    @ApiResponse({ status: 401, description: 'No autorizado.' })
    @ApiResponse({ status: 403, description: 'Permisos insuficientes.' })
    findAll(@Query() query: ApiQueryDto): Promise<Regional[]> {
        return this.regionsService.list({
            limit: query.limit,
            page: query.page,
            included: query.included,
            filter: query.filter,
        });
    }

    /**
     * POST /regions
     * Crea una nueva regional.
     */
    @Post()
    @CheckPolicies((ability: AppAbility) => ability.can('create', 'Regional'))
    @ApiOperation({ summary: 'Crear regional', description: 'Crea una nueva regional.' })
    @ApiResponse({ status: 201, description: 'Regional creada.' })
    @ApiResponse({ status: 400, description: 'Datos inválidos.' })
    @ApiResponse({ status: 409, description: 'La regional ya existe.' })
    create(@Body() createDto: CreateRegionalDto): Promise<Regional> {
        return this.regionsService.create(createDto);
    }

    // === RUTAS CON PARÁMETROS ===

    /**
     * GET /regions/:id
     * Obtiene una regional por ID.
     */
    @Get(':id')
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Regional'))
    @ApiOperation({ summary: 'Obtener regional', description: 'Obtiene una regional por ID.' })
    @ApiParam({ name: 'id', description: 'ID de la regional' })
    @ApiQuery({ name: 'included', required: false, description: 'Relaciones a incluir' })
    @ApiResponse({ status: 200, description: 'Regional encontrada.' })
    @ApiResponse({ status: 404, description: 'Regional no encontrada.' })
    findOne(
        @Param('id', ParseIntPipe) id: number,
        @Query('included') included?: string,
    ): Promise<Regional> {
        return this.regionsService.show(id, { included });
    }

    /**
     * PUT /regions/:id
     * Actualiza una regional.
     */
    @Put(':id')
    @CheckPolicies((ability: AppAbility) => ability.can('update', 'Regional'))
    @ApiOperation({ summary: 'Actualizar regional', description: 'Actualiza una regional existente.' })
    @ApiParam({ name: 'id', description: 'ID de la regional' })
    @ApiResponse({ status: 200, description: 'Regional actualizada.' })
    @ApiResponse({ status: 404, description: 'Regional no encontrada.' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdateRegionalDto,
    ): Promise<Regional> {
        return this.regionsService.update(id, updateDto);
    }

    /**
     * DELETE /regions/:id
     * Elimina (soft delete) una regional.
     */
    @Delete(':id')
    @CheckPolicies((ability: AppAbility) => ability.can('delete', 'Regional'))
    @ApiOperation({ summary: 'Eliminar regional', description: 'Marca la regional como eliminada (estado=0).' })
    @ApiParam({ name: 'id', description: 'ID de la regional' })
    @ApiResponse({ status: 200, description: 'Regional eliminada.' })
    @ApiResponse({ status: 404, description: 'Regional no encontrada.' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.regionsService.delete(id);
    }
}
