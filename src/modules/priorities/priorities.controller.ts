import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    Query,
    Put,
    ParseIntPipe,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PrioritiesService } from './priorities.service';
import { CreatePriorityDto } from './dto/create-priority.dto';
import { UpdatePriorityDto } from './dto/update-priority.dto';
import { ApiQueryDto } from '../../common/dto/api-query.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PoliciesGuard } from '../../common/guards/policies.guard';
import { CheckPolicies } from '../auth/decorators/check-policies.decorator';
import { AppAbility } from '../auth/abilities/ability.factory';

@ApiTags('Priorities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('priorities')
export class PrioritiesController {
    constructor(private readonly prioritiesService: PrioritiesService) { }

    /**
     * GET /priorities
     * 
     * Listar prioridades con paginación y filtros.
     * Soporta filtrado por nombre, estado y relaciones (subcategoria, tickets).
     * 
     * @authorization Requiere `read` sobre `Priority`
     */
    @Get()
    @ApiOperation({ summary: 'Listar prioridades', description: 'Endpoint para listar prioridades con filtros dinámicos (ApiQueryHelper).' })
    @ApiResponse({ status: 200, description: 'Lista de prioridades.' })
    @ApiResponse({ status: 401, description: 'No autorizado.' })
    @ApiResponse({ status: 403, description: 'Permisos insuficientes.' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Límite de resultados por página.' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página actual.' })
    @ApiQuery({ name: 'included', required: false, type: String, description: 'Relaciones a incluir separadas por coma (ej: subcategoria,tickets).' })
    @ApiQuery({ name: 'filter[nombre]', required: false, type: String, description: 'Filtrar por nombre (LIKE).' })
    @ApiQuery({ name: 'filter[estado]', required: false, type: Number, description: 'Filtrar por estado (1=Activo, 0=Inactivo).' })
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Priority'))
    findAll(@Query() query: ApiQueryDto) {
        return this.prioritiesService.list({
            limit: query.limit,
            page: query.page,
            included: query.included,
            filter: query.filter as any,
        });
    }

    /**
     * GET /priorities/:id
     * 
     * Obtiene el detalle de una prioridad por su ID.
     * 
     * @authorization Requiere `read` sobre `Priority`
     */
    @Get(':id')
    @ApiOperation({ summary: 'Obtener prioridad', description: 'Obtiene los detalles de una prioridad específica por ID.' })
    @ApiResponse({ status: 200, description: 'Prioridad encontrada.' })
    @ApiResponse({ status: 404, description: 'Prioridad no encontrada.' })
    @ApiQuery({ name: 'included', required: false, type: String, description: 'Relaciones a incluir (ej: subcategoria).' })
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Priority'))
    findOne(
        @Param('id', ParseIntPipe) id: number,
        @Query('included') included?: string,
    ) {
        return this.prioritiesService.show(id, { included });
    }

    /**
     * POST /priorities
     * 
     * Crea una nueva prioridad en el sistema.
     * 
     * @authorization Requiere `create` sobre `Priority`
     */
    @Post()
    @ApiOperation({ summary: 'Crear prioridad', description: 'Crea una nueva prioridad.' })
    @ApiResponse({ status: 201, description: 'Prioridad creada exitosamente.' })
    @ApiResponse({ status: 409, description: 'El nombre de la prioridad ya existe.' })
    @CheckPolicies((ability: AppAbility) => ability.can('create', 'Priority'))
    create(@Body() createPriorityDto: CreatePriorityDto) {
        return this.prioritiesService.create(createPriorityDto);
    }

    /**
     * PUT /priorities/:id
     * 
     * Actualiza una prioridad existente.
     * 
     * @authorization Requiere `update` sobre `Priority`
     */
    @Put(':id')
    @ApiOperation({ summary: 'Actualizar prioridad', description: 'Actualiza los datos de una prioridad existente.' })
    @ApiResponse({ status: 200, description: 'Prioridad actualizada.' })
    @ApiResponse({ status: 404, description: 'Prioridad no encontrada.' })
    @CheckPolicies((ability: AppAbility) => ability.can('update', 'Priority'))
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updatePriorityDto: UpdatePriorityDto,
    ) {
        return this.prioritiesService.update(id, updatePriorityDto);
    }

    /**
     * DELETE /priorities/:id
     * 
     * Realiza un borrado lógico (Soft Delete) de la prioridad.
     * 
     * @authorization Requiere `delete` sobre `Priority`
     */
    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar prioridad', description: 'Marca la prioridad como eliminada (estado=0).' })
    @ApiResponse({ status: 200, description: 'Prioridad eliminada.' })
    @ApiResponse({ status: 404, description: 'Prioridad no encontrada.' })
    @CheckPolicies((ability: AppAbility) => ability.can('delete', 'Priority'))
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.prioritiesService.delete(id);
    }
}
