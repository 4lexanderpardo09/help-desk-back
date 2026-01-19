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
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { Consulta } from './entities/consulta.entity';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PoliciesGuard } from '../../common/guards/policies.guard';
import { CheckPolicies } from '../auth/decorators/check-policies.decorator';
import { ApiQueryDto } from '../../common/dto/api-query.dto';

@ApiTags('Reportes SQL')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get()
    @CheckPolicies((ability) => ability.can('read', 'Report'))
    @ApiOperation({ summary: 'Listar reportes', description: 'Listado de consultas SQL guardadas.' })
    @ApiResponse({ status: 200, type: [Consulta] })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'filter', required: false, type: Object })
    list(@Query() query: ApiQueryDto) {
        return this.reportsService.list({
            limit: query.limit,
            page: query.page,
            filter: query.filter,
        });
    }

    @Get(':id')
    @CheckPolicies((ability) => ability.can('read', 'Report'))
    @ApiOperation({ summary: 'Ver reporte', description: 'Detalle de una consulta SQL almacenada.' })
    @ApiParam({ name: 'id', description: 'ID del reporte' })
    @ApiResponse({ status: 200, type: Consulta })
    @ApiResponse({ status: 404, description: 'Reporte no encontrado' })
    show(@Param('id', ParseIntPipe) id: number) {
        return this.reportsService.show(id);
    }

    @Post()
    @CheckPolicies((ability) => ability.can('create', 'Report'))
    @ApiOperation({ summary: 'Crear reporte', description: 'Guarda una nueva consulta SQL.' })
    @ApiResponse({ status: 201, type: Consulta })
    @ApiResponse({ status: 409, description: 'Nombre duplicado' })
    create(@Body() createDto: CreateReportDto) {
        return this.reportsService.create(createDto);
    }

    @Put(':id')
    @CheckPolicies((ability) => ability.can('update', 'Report'))
    @ApiOperation({ summary: 'Actualizar reporte', description: 'Modifica una consulta existente.' })
    @ApiParam({ name: 'id', description: 'ID del reporte' })
    @ApiResponse({ status: 200, type: Consulta })
    @ApiResponse({ status: 404, description: 'Reporte no encontrado' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdateReportDto,
    ) {
        return this.reportsService.update(id, updateDto);
    }

    @Delete(':id')
    @CheckPolicies((ability) => ability.can('delete', 'Report'))
    @ApiOperation({ summary: 'Eliminar reporte', description: 'Soft delete de la consulta.' })
    @ApiParam({ name: 'id', description: 'ID del reporte' })
    @ApiResponse({ status: 200, description: 'Consulta eliminada' })
    delete(@Param('id', ParseIntPipe) id: number) {
        return this.reportsService.delete(id);
    }
}
