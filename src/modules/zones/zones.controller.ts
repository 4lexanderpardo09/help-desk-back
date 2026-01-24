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
import { ZonesService } from './zones.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PoliciesGuard } from '../../common/guards/policies.guard';
import { CheckPolicies } from '../auth/decorators/check-policies.decorator';
import { ApiQueryDto } from '../../common/dto/api-query.dto';
import { Zona } from './entities/zona.entity';

@ApiTags('Zones')
@ApiBearerAuth()
@Controller('zones')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class ZonesController {
    constructor(private readonly zonesService: ZonesService) { }

    /**
     * GET /zones
     * Listar zonas con filtros
     */
    @Get()
    @CheckPolicies((ability) => ability.can('read', 'Zone')) // 'Zone' subject will be added later
    @ApiOperation({ summary: 'Listar zonas', description: 'Listado de zonas con filtros dinámicos.' })
    @ApiQuery({ name: 'included', required: false, description: 'Relaciones: regionales' })
    @ApiQuery({ name: 'filter[nombre]', required: false, description: 'Filtrar por nombre' })
    @ApiResponse({ status: 200, description: 'Lista de zonas.' })
    async list(@Query() query: ApiQueryDto): Promise<import('../../common/utils/api-query-helper').PaginatedResult<Zona>> {
        return this.zonesService.list({
            limit: query.limit,
            page: query.page,
            included: query.included,
            filter: query.filter,
        });
    }

    /**
     * GET /zones/:id
     * Mostrar zona por ID
     */
    @Get(':id')
    @CheckPolicies((ability) => ability.can('read', 'Zone'))
    @ApiOperation({ summary: 'Mostrar zona', description: 'Obtiene detalles de una zona.' })
    @ApiParam({ name: 'id', description: 'ID de la zona' })
    @ApiResponse({ status: 200, description: 'Zona encontrada.' })
    @ApiResponse({ status: 404, description: 'Zona no encontrada.' })
    async show(
        @Param('id', ParseIntPipe) id: number,
        @Query('included') included?: string,
    ): Promise<Zona | null> {
        return this.zonesService.show(id, { included });
    }

    /**
     * POST /zones
     * Crear zona
     */
    @Post()
    @CheckPolicies((ability) => ability.can('create', 'Zone'))
    @ApiOperation({ summary: 'Crear zona', description: 'Crea una nueva zona.' })
    @ApiResponse({ status: 201, description: 'Zona creada.' })
    async create(@Body() createZoneDto: CreateZoneDto): Promise<Zona> {
        return this.zonesService.create(createZoneDto);
    }

    /**
     * PUT /zones/:id
     * Actualizar zona
     */
    @Put(':id')
    @CheckPolicies((ability) => ability.can('update', 'Zone'))
    @ApiOperation({ summary: 'Actualizar zona', description: 'Actualiza datos de una zona.' })
    @ApiParam({ name: 'id', description: 'ID de la zona' })
    @ApiResponse({ status: 200, description: 'Zona actualizada.' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateZoneDto: UpdateZoneDto,
    ): Promise<Zona> {
        return this.zonesService.update(id, updateZoneDto);
    }

    /**
     * DELETE /zones/:id
     * Eliminar zona (Soft Delete)
     */
    @Delete(':id')
    @CheckPolicies((ability) => ability.can('delete', 'Zone'))
    @ApiOperation({ summary: 'Eliminar zona', description: 'Soft delete de una zona.' })
    @ApiParam({ name: 'id', description: 'ID de la zona' })
    @ApiResponse({ status: 200, description: 'Zona eliminada.' })
    async delete(@Param('id', ParseIntPipe) id: number) {
        return this.zonesService.delete(id);
    }
}
