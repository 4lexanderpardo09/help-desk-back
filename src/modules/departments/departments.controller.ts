import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PoliciesGuard } from '../../common/guards/policies.guard';
import { CheckPolicies } from '../auth/decorators/check-policies.decorator';
import { AppAbility } from '../auth/abilities/ability.factory';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { ApiQueryDto } from 'src/common/dto/api-query.dto';

@ApiTags('Departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('departments')
export class DepartmentsController {
    constructor(private readonly departmentsService: DepartmentsService) { }

    /**
     * GET /departments
     * 
     * Lista todos los departamentos con paginación y filtrado.
     * 
     * @authorization Requiere `read` sobre `Department`
     */
    @Get()
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Department'))
    @ApiOperation({ summary: 'Listar departamentos', description: 'Permite filtrar por nombre, estado y paginar resultados.' })
    @ApiQuery({ name: 'included', required: false, description: 'Relaciones a incluir (ej: usuarios, categorias)' })
    @ApiQuery({ name: 'filter[nombre]', required: false, description: 'Filtrar por nombre (LIKE)' })
    @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados por página' })
    @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
    @ApiResponse({ status: 200, description: 'Lista de departamentos' })
    @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
    findAll(@Query() query: ApiQueryDto) {
        return this.departmentsService.list({
            limit: query.limit,
            page: query.page,
            included: query.included,
            filter: query.filter,
        });
    }

    /**
     * GET /departments/:id
     * 
     * Obtiene un departamento por ID.
     * 
     * @authorization Requiere `read` sobre `Department`
     */
    @Get(':id')
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Department'))
    @ApiOperation({ summary: 'Obtener departamento por ID', description: 'Retorna un departamento específico.' })
    @ApiParam({ name: 'id', description: 'ID del departamento' })
    @ApiQuery({ name: 'included', required: false, description: 'Relaciones a incluir' })
    @ApiResponse({ status: 200, description: 'Departamento encontrado' })
    @ApiResponse({ status: 404, description: 'Departamento no encontrado' })
    findOne(@Param('id') id: string, @Query() query: ApiQueryDto) {
        return this.departmentsService.show(+id, {
            included: query.included
        });
    }

    /**
     * POST /departments
     * 
     * Crea un nuevo departamento.
     * 
     * @authorization Requiere `create` sobre `Department`
     */
    @Post()
    @CheckPolicies((ability: AppAbility) => ability.can('create', 'Department'))
    @ApiOperation({ summary: 'Crear departamento', description: 'Crea un nuevo departamento en el sistema.' })
    @ApiResponse({ status: 201, description: 'Departamento creado exitosamente' })
    @ApiResponse({ status: 400, description: 'Datos inválidos' })
    @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
    create(@Body() createDto: CreateDepartmentDto) {
        return this.departmentsService.create(createDto);
    }

    /**
     * PUT /departments/:id
     * 
     * Actualiza un departamento existente.
     * 
     * @authorization Requiere `update` sobre `Department`
     */
    @Put(':id')
    @CheckPolicies((ability: AppAbility) => ability.can('update', 'Department'))
    @ApiOperation({ summary: 'Actualizar departamento', description: 'Actualiza los datos de un departamento existente.' })
    @ApiParam({ name: 'id', description: 'ID del departamento' })
    @ApiResponse({ status: 200, description: 'Departamento actualizado' })
    @ApiResponse({ status: 404, description: 'Departamento no encontrado' })
    update(@Param('id') id: string, @Body() updateDto: UpdateDepartmentDto) {
        return this.departmentsService.update(+id, updateDto);
    }

    /**
     * DELETE /departments/:id
     * 
     * Elimina un departamento (Soft Delete).
     * 
     * @authorization Requiere `delete` sobre `Department`
     */
    @Delete(':id')
    @CheckPolicies((ability: AppAbility) => ability.can('delete', 'Department'))
    @ApiOperation({ summary: 'Eliminar departamento', description: 'Marca un departamento como inactivo.' })
    @ApiParam({ name: 'id', description: 'ID del departamento' })
    @ApiResponse({ status: 200, description: 'Departamento eliminado' })
    @ApiResponse({ status: 404, description: 'Departamento no encontrado' })
    remove(@Param('id') id: string) {
        return this.departmentsService.delete(+id);
    }
}
