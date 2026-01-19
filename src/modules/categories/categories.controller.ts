import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PoliciesGuard } from '../../common/guards/policies.guard';
import { CheckPolicies } from '../auth/decorators/check-policies.decorator';
import { AppAbility } from '../auth/abilities/ability.factory';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ApiQueryDto } from 'src/common/dto/api-query.dto';

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    /**
     * GET /categories
     * 
     * Lista todas las categorías con paginación y filtrado.
     * Soporta inclusión de relaciones y filtros dinámicos.
     * 
     * @authorization Requiere `read` sobre `Category`
     */
    @Get()
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Category'))
    @ApiOperation({ summary: 'Listar categorías con filtros', description: 'Permite filtrar por nombre, estado y paginar resultados.' })
    @ApiQuery({ name: 'included', required: false, description: 'Relaciones a incluir (ej: subcategorias, departamentos)' })
    @ApiQuery({ name: 'filter[nombre]', required: false, description: 'Filtrar por nombre (LIKE)' })
    @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados por página' })
    @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
    @ApiResponse({ status: 200, description: 'Lista de categorías' })
    @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
    findAll(@Query() query: ApiQueryDto) {
        return this.categoriesService.list({
            limit: query.limit,
            page: query.page,
            included: query.included,
            filter: query.filter,
        });
    }

    /**
     * GET /categories/:id
     * 
     * Obtiene una categoría específica por ID.
     * 
     * @authorization Requiere `read` sobre `Category`
     */
    @Get(':id')
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Category'))
    @ApiOperation({ summary: 'Obtener categoría por ID', description: 'Retorna una categoría específica y sus relaciones opcionales.' })
    @ApiParam({ name: 'id', description: 'ID de la categoría' })
    @ApiQuery({ name: 'included', required: false, description: 'Relaciones a incluir' })
    @ApiResponse({ status: 200, description: 'Categoría encontrada' })
    @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
    findOne(@Param('id') id: string, @Query() query: ApiQueryDto) {
        return this.categoriesService.show(+id, {
            included: query.included
        });
    }

    /**
     * POST /categories
     * 
     * Crea una nueva categoría.
     * 
     * @authorization Requiere `create` sobre `Category`
     */
    @Post()
    @CheckPolicies((ability: AppAbility) => ability.can('create', 'Category'))
    @ApiOperation({ summary: 'Crear nueva categoría', description: 'Crea una categoría en el sistema.' })
    @ApiResponse({ status: 201, description: 'Categoría creada exitosamente' })
    @ApiResponse({ status: 400, description: 'Datos inválidos' })
    @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
    create(@Body() createDto: CreateCategoryDto) {
        return this.categoriesService.create(createDto);
    }

    /**
     * PUT /categories/:id
     * 
     * Actualiza una categoría existente.
     * 
     * @authorization Requiere `update` sobre `Category`
     */
    @Put(':id')
    @CheckPolicies((ability: AppAbility) => ability.can('update', 'Category'))
    @ApiOperation({ summary: 'Actualizar categoría', description: 'Actualiza los datos de una categoría existente.' })
    @ApiParam({ name: 'id', description: 'ID de la categoría' })
    @ApiResponse({ status: 200, description: 'Categoría actualizada' })
    @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
    update(@Param('id') id: string, @Body() updateDto: UpdateCategoryDto) {
        return this.categoriesService.update(+id, updateDto);
    }

    /**
     * DELETE /categories/:id
     * 
     * Elimina una categoría (Soft Delete).
     * 
     * @authorization Requiere `delete` sobre `Category`
     */
    @Delete(':id')
    @CheckPolicies((ability: AppAbility) => ability.can('delete', 'Category'))
    @ApiOperation({ summary: 'Eliminar categoría (soft delete)', description: 'Marca una categoría como inactiva (estado 0).' })
    @ApiParam({ name: 'id', description: 'ID de la categoría' })
    @ApiResponse({ status: 200, description: 'Categoría eliminada' })
    @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
    remove(@Param('id') id: string) {
        return this.categoriesService.delete(+id);
    }
}
