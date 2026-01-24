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
import { PositionsService } from './positions.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { ApiQueryDto } from '../../common/dto/api-query.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PoliciesGuard } from '../../common/guards/policies.guard';
import { CheckPolicies } from '../auth/decorators/check-policies.decorator';
import { AppAbility } from '../auth/abilities/ability.factory';

@ApiTags('Positions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('positions')
export class PositionsController {
    constructor(private readonly positionsService: PositionsService) { }

    /**
     * GET /positions
     * 
     * Listar cargos con paginación y filtros.
     * 
     * @authorization Requiere `read` sobre `Position`
     */
    @Get()
    @ApiOperation({ summary: 'Listar cargos', description: 'Endpoint para listar cargos con filtros dinámicos.' })
    @ApiResponse({ status: 200, description: 'Lista de cargos.' })
    @ApiResponse({ status: 401, description: 'No autorizado.' })
    @ApiResponse({ status: 403, description: 'Permisos insuficientes.' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Límite de resultados por página.' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página actual.' })
    @ApiQuery({ name: 'included', required: false, type: String, description: 'Relaciones a incluir (ej: usuarios,organigrama).' })
    @ApiQuery({ name: 'filter[nombre]', required: false, type: String, description: 'Filtrar por nombre (LIKE).' })
    @ApiQuery({ name: 'filter[estado]', required: false, type: Number, description: 'Filtrar por estado (1=Activo, 0=Inactivo).' })
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Position'))
    findAll(@Query() query: ApiQueryDto): Promise<import('../../common/utils/api-query-helper').PaginatedResult<import('./entities/cargo.entity').Cargo>> {
        return this.positionsService.list({
            limit: query.limit,
            page: query.page,
            included: query.included,
            filter: query.filter as any,
        });
    }

    /**
     * GET /positions/:id
     * 
     * Obtiene el detalle de un cargo por su ID.
     * 
     * @authorization Requiere `read` sobre `Position`
     */
    @Get(':id')
    @ApiOperation({ summary: 'Obtener cargo', description: 'Obtiene los detalles de un cargo específico por ID.' })
    @ApiResponse({ status: 200, description: 'Cargo encontrado.' })
    @ApiResponse({ status: 404, description: 'Cargo no encontrado.' })
    @ApiQuery({ name: 'included', required: false, type: String, description: 'Relaciones a incluir (ej: usuarios).' })
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Position'))
    findOne(
        @Param('id', ParseIntPipe) id: number,
        @Query('included') included?: string,
    ) {
        return this.positionsService.show(id, { included });
    }

    /**
     * POST /positions
     * 
     * Crea un nuevo cargo en el sistema.
     * 
     * @authorization Requiere `create` sobre `Position`
     */
    @Post()
    @ApiOperation({ summary: 'Crear cargo', description: 'Crea un nuevo cargo.' })
    @ApiResponse({ status: 201, description: 'Cargo creado exitosamente.' })
    @ApiResponse({ status: 409, description: 'El nombre del cargo ya existe.' })
    @CheckPolicies((ability: AppAbility) => ability.can('create', 'Position'))
    create(@Body() createPositionDto: CreatePositionDto) {
        return this.positionsService.create(createPositionDto);
    }

    /**
     * PUT /positions/:id
     * 
     * Actualiza un cargo existente.
     * 
     * @authorization Requiere `update` sobre `Position`
     */
    @Put(':id')
    @ApiOperation({ summary: 'Actualizar cargo', description: 'Actualiza los datos de un cargo existente.' })
    @ApiResponse({ status: 200, description: 'Cargo actualizado.' })
    @ApiResponse({ status: 404, description: 'Cargo no encontrado.' })
    @CheckPolicies((ability: AppAbility) => ability.can('update', 'Position'))
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updatePositionDto: UpdatePositionDto,
    ) {
        return this.positionsService.update(id, updatePositionDto);
    }

    /**
     * DELETE /positions/:id
     * 
     * Realiza un borrado lógico (Soft Delete) del cargo.
     * 
     * @authorization Requiere `delete` sobre `Position`
     */
    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar cargo', description: 'Marca el cargo como eliminado (estado=0).' })
    @ApiResponse({ status: 200, description: 'Cargo eliminado.' })
    @ApiResponse({ status: 404, description: 'Cargo no encontrado.' })
    @CheckPolicies((ability: AppAbility) => ability.can('delete', 'Position'))
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.positionsService.delete(id);
    }
}
