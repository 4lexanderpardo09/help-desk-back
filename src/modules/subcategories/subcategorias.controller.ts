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
import { SubcategoriasService } from './subcategorias.service';
import { CreateSubcategoriaDto } from './dto/create-subcategoria.dto';
import { UpdateSubcategoriaDto } from './dto/update-subcategoria.dto';
import { Subcategoria } from './entities/subcategoria.entity';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PoliciesGuard } from '../../common/guards/policies.guard';
import { CheckPolicies } from '../auth/decorators/check-policies.decorator';
import { ApiQueryDto } from '../../common/dto/api-query.dto';

@ApiTags('Subcategorias')
@ApiBearerAuth()
@Controller('subcategorias')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class SubcategoriasController {
    constructor(private readonly subcategoriasService: SubcategoriasService) { }

    // === RUTAS SIN PARÁMETROS ===

    /**
     * GET /subcategorias
     * 
     * **MASTER ENDPOINT**: Listado y búsqueda unificada de subcategorías.
     */
    @Get()
    @CheckPolicies((ability) => ability.can('read', 'Subcategoria'))
    @ApiOperation({ summary: 'Listar subcategorías', description: 'Endpoint maestro para listar subcategorías con filtros dinámicos y relaciones.' })
    @ApiResponse({ status: 200, description: 'Lista de subcategorías retornada exitosamente.', type: [Subcategoria] })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Número de resultados por página' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página' })
    @ApiQuery({ name: 'filter', required: false, type: Object, description: 'Filtros dinámicos' })
    @ApiQuery({ name: 'included', required: false, type: String, description: 'Relaciones a incluir (categoria, prioridad)' })
    list(@Query() query: ApiQueryDto) {
        return this.subcategoriasService.list({
            limit: query.limit,
            page: query.page,
            filter: query.filter,
            included: query.included,
        });
    }

    /**
     * POST /subcategorias
     * Crea una nueva subcategoría.
     */
    @Post()
    @CheckPolicies((ability) => ability.can('create', 'Subcategoria'))
    @ApiOperation({ summary: 'Crear subcategoría', description: 'Crea una nueva subcategoría en el sistema.' })
    @ApiResponse({ status: 201, description: 'Subcategoría creada exitosamente.', type: Subcategoria })
    @ApiResponse({ status: 400, description: 'Datos inválidos.' })
    @ApiResponse({ status: 409, description: 'La subcategoría ya existe.' })
    create(@Body() createDto: CreateSubcategoriaDto) {
        return this.subcategoriasService.create(createDto);
    }

    // === RUTAS CON :id ===

    /**
     * GET /subcategorias/:id
     * Obtiene una subcategoría por ID con relaciones opcionales.
     */
    @Get(':id')
    @CheckPolicies((ability) => ability.can('read', 'Subcategoria'))
    @ApiOperation({ summary: 'Mostrar subcategoría', description: 'Obtiene los detalles de una subcategoría por ID.' })
    @ApiParam({ name: 'id', description: 'ID de la subcategoría' })
    @ApiResponse({ status: 200, description: 'Subcategoría encontrada.', type: Subcategoria })
    @ApiResponse({ status: 404, description: 'Subcategoría no encontrada.' })
    @ApiQuery({ name: 'included', required: false, description: 'Relaciones a incluir (categoria, prioridad)' })
    show(
        @Param('id', ParseIntPipe) id: number,
        @Query('included') included?: string,
    ) {
        return this.subcategoriasService.show(id, { included });
    }

    /**
     * PUT /subcategorias/:id
     * Actualiza una subcategoría existente.
     */
    @Put(':id')
    @CheckPolicies((ability) => ability.can('update', 'Subcategoria'))
    @ApiOperation({ summary: 'Actualizar subcategoría', description: 'Actualiza los datos de una subcategoría existente.' })
    @ApiParam({ name: 'id', description: 'ID de la subcategoría' })
    @ApiResponse({ status: 200, description: 'Subcategoría actualizada exitosamente.', type: Subcategoria })
    @ApiResponse({ status: 404, description: 'Subcategoría no encontrada.' })
    update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateSubcategoriaDto) {
        return this.subcategoriasService.update(id, updateDto);
    }

    /**
     * DELETE /subcategorias/:id
     * Elimina una subcategoría (Soft Delete).
     */
    @Delete(':id')
    @CheckPolicies((ability) => ability.can('delete', 'Subcategoria'))
    @ApiOperation({ summary: 'Eliminar subcategoría', description: 'Realiza un borrado lógico (estado = 0).' })
    @ApiParam({ name: 'id', description: 'ID de la subcategoría' })
    @ApiResponse({ status: 200, description: 'Subcategoría eliminada exitosamente.' })
    @ApiResponse({ status: 404, description: 'Subcategoría no encontrada.' })
    delete(@Param('id', ParseIntPipe) id: number) {
        return this.subcategoriasService.delete(id);
    }
}
