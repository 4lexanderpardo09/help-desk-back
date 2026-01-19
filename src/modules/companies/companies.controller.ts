import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PoliciesGuard } from '../../common/guards/policies.guard';
import { CheckPolicies } from '../auth/decorators/check-policies.decorator';
import { AppAbility } from '../auth/abilities/ability.factory';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { ApiQueryDto } from 'src/common/dto/api-query.dto';

@ApiTags('Companies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('companies')
export class CompaniesController {
    constructor(private readonly companiesService: CompaniesService) { }

    /**
     * GET /companies
     * 
     * Lista todas las empresas con paginación y filtrado.
     * Soporta inclusión de relaciones y filtros dinámicos.
     * 
     * @authorization Requiere `read` sobre `Company`
     */
    @Get()
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Company'))
    @ApiOperation({ summary: 'Listar empresas con filtros', description: 'Permite filtrar por nombre, estado y paginar resultados.' })
    @ApiQuery({ name: 'included', required: false, description: 'Relaciones a incluir (ej: usuarios, categorias, tickets)' })
    @ApiQuery({ name: 'filter[nombre]', required: false, description: 'Filtrar por nombre (LIKE)' })
    @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados por página' })
    @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
    @ApiResponse({ status: 200, description: 'Lista de empresas' })
    @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
    findAll(@Query() query: ApiQueryDto) {
        return this.companiesService.list({
            limit: query.limit,
            page: query.page,
            included: query.included,
            filter: query.filter,
        });
    }

    /**
     * GET /companies/:id
     * 
     * Obtiene una empresa específica por ID.
     * 
     * @authorization Requiere `read` sobre `Company`
     */
    @Get(':id')
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Company'))
    @ApiOperation({ summary: 'Obtener empresa por ID', description: 'Retorna una empresa específica y sus relaciones opcionales.' })
    @ApiParam({ name: 'id', description: 'ID de la empresa' })
    @ApiQuery({ name: 'included', required: false, description: 'Relaciones a incluir' })
    @ApiResponse({ status: 200, description: 'Empresa encontrada' })
    @ApiResponse({ status: 404, description: 'Empresa no encontrada' })
    findOne(@Param('id') id: string, @Query() query: ApiQueryDto) {
        return this.companiesService.show(+id, {
            included: query.included
        });
    }

    /**
     * POST /companies
     * 
     * Crea una nueva empresa.
     * 
     * @authorization Requiere `create` sobre `Company`
     */
    @Post()
    @CheckPolicies((ability: AppAbility) => ability.can('create', 'Company'))
    @ApiOperation({ summary: 'Crear nueva empresa', description: 'Crea una empresa en el sistema.' })
    @ApiResponse({ status: 201, description: 'Empresa creada exitosamente' })
    @ApiResponse({ status: 400, description: 'Datos inválidos' })
    @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
    create(@Body() createDto: CreateCompanyDto) {
        return this.companiesService.create(createDto);
    }

    /**
     * PUT /companies/:id
     * 
     * Actualiza una empresa existente.
     * 
     * @authorization Requiere `update` sobre `Company`
     */
    @Put(':id')
    @CheckPolicies((ability: AppAbility) => ability.can('update', 'Company'))
    @ApiOperation({ summary: 'Actualizar empresa', description: 'Actualiza los datos de una empresa existente.' })
    @ApiParam({ name: 'id', description: 'ID de la empresa' })
    @ApiResponse({ status: 200, description: 'Empresa actualizada' })
    @ApiResponse({ status: 404, description: 'Empresa no encontrada' })
    update(@Param('id') id: string, @Body() updateDto: UpdateCompanyDto) {
        return this.companiesService.update(+id, updateDto);
    }

    /**
     * DELETE /companies/:id
     * 
     * Elimina una empresa (Soft Delete).
     * 
     * @authorization Requiere `delete` sobre `Company`
     */
    @Delete(':id')
    @CheckPolicies((ability: AppAbility) => ability.can('delete', 'Company'))
    @ApiOperation({ summary: 'Eliminar empresa (soft delete)', description: 'Marca una empresa como inactiva (estado 0).' })
    @ApiParam({ name: 'id', description: 'ID de la empresa' })
    @ApiResponse({ status: 200, description: 'Empresa eliminada' })
    @ApiResponse({ status: 404, description: 'Empresa no encontrada' })
    remove(@Param('id') id: string) {
        return this.companiesService.delete(+id);
    }
}
