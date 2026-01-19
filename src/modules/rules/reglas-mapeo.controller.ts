import {
    Controller,
    Get,
    Post,
    Body,
    Put,
    Param,
    Delete,
    UseGuards,
    Query,
    ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ReglasMapeoService } from './reglas-mapeo.service';
import { CreateReglaMapeoDto } from './dto/create-regla-mapeo.dto';
import { UpdateReglaMapeoDto } from './dto/update-regla-mapeo.dto';
import { ReglaMapeo } from './entities/regla-mapeo.entity';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PoliciesGuard } from '../../common/guards/policies.guard';
import { CheckPolicies } from '../auth/decorators/check-policies.decorator';
import { ApiQueryDto } from '../../common/dto/api-query.dto';

@ApiTags('Reglas de Mapeo')
@ApiBearerAuth()
@Controller('reglas-mapeo')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class ReglasMapeoController {
    constructor(private readonly reglasService: ReglasMapeoService) { }

    // === RUTAS SIN PARÁMETROS ===

    /**
     * GET /reglas-mapeo
     * 
     * **MASTER ENDPOINT**: Listado de reglas de mapeo.
     */
    @Get()
    @CheckPolicies((ability) => ability.can('read', 'Rule'))
    @ApiOperation({ summary: 'Listar reglas', description: 'Endpoint maestro para listar reglas de mapeo con filtros y relaciones.' })
    @ApiResponse({ status: 200, description: 'Lista de reglas retornada exitosamente.', type: [ReglaMapeo] })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Número de resultados por página' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página' })
    @ApiQuery({ name: 'filter', required: false, type: Object, description: 'Filtros dinámicos' })
    @ApiQuery({ name: 'included', required: false, type: String, description: 'Relaciones: subcategoria, creadores.cargo, asignados.cargo, creadoresPerfil.perfil' })
    list(@Query() query: ApiQueryDto) {
        return this.reglasService.list({
            limit: query.limit,
            page: query.page,
            filter: query.filter,
            included: query.included,
        });
    }

    /**
     * POST /reglas-mapeo
     * Crea una nueva regla de mapeo.
     */
    @Post()
    @CheckPolicies((ability) => ability.can('create', 'Rule'))
    @ApiOperation({ summary: 'Crear regla', description: 'Crea una nueva regla de mapeo con cargos y perfiles asociados.' })
    @ApiResponse({ status: 201, description: 'Regla creada exitosamente.', type: ReglaMapeo })
    @ApiResponse({ status: 400, description: 'Datos inválidos.' })
    @ApiResponse({ status: 409, description: 'Ya existe regla para esta subcategoría.' })
    create(@Body() createDto: CreateReglaMapeoDto) {
        return this.reglasService.create(createDto);
    }

    // === RUTAS CON :id ===

    /**
     * GET /reglas-mapeo/:id
     * Obtiene una regla por ID con relaciones opcionales.
     */
    @Get(':id')
    @CheckPolicies((ability) => ability.can('read', 'Rule'))
    @ApiOperation({ summary: 'Mostrar regla', description: 'Obtiene los detalles de una regla por ID.' })
    @ApiParam({ name: 'id', description: 'ID de la regla' })
    @ApiResponse({ status: 200, description: 'Regla encontrada.', type: ReglaMapeo })
    @ApiResponse({ status: 404, description: 'Regla no encontrada.' })
    @ApiQuery({ name: 'included', required: false, description: 'Relaciones a incluir' })
    show(
        @Param('id', ParseIntPipe) id: number,
        @Query('included') included?: string,
    ) {
        return this.reglasService.show(id, { included });
    }
    /**
     * PUT /reglas-mapeo/:id
     * Actualiza una regla existente (reemplaza todas las relaciones).
     */
    @Put(':id')
    @CheckPolicies((ability) => ability.can('update', 'Rule'))
    @ApiOperation({ summary: 'Actualizar regla', description: 'Actualiza regla y sus relaciones (delete + insert).' })
    @ApiParam({ name: 'id', description: 'ID de la regla' })
    @ApiResponse({ status: 200, description: 'Regla actualizada exitosamente.', type: ReglaMapeo })
    @ApiResponse({ status: 404, description: 'Regla no encontrada.' })
    update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateReglaMapeoDto) {
        return this.reglasService.update(id, updateDto);
    }

    /**
     * DELETE /reglas-mapeo/:id
     * Elimina una regla (Soft Delete).
     */
    @Delete(':id')
    @CheckPolicies((ability) => ability.can('delete', 'Rule'))
    @ApiOperation({ summary: 'Eliminar regla', description: 'Realiza un borrado lógico (estado = 0).' })
    @ApiParam({ name: 'id', description: 'ID de la regla' })
    @ApiResponse({ status: 200, description: 'Regla eliminada exitosamente.' })
    @ApiResponse({ status: 404, description: 'Regla no encontrada.' })
    delete(@Param('id', ParseIntPipe) id: number) {
        return this.reglasService.delete(id);
    }
}
