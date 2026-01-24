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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { OrganigramaService } from './organigrama.service';
import { CreateOrganigramaDto } from './dto/create-organigrama.dto';
import { UpdateOrganigramaDto } from './dto/update-organigrama.dto';
import { ApiQueryDto } from '../../common/dto/api-query.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PoliciesGuard } from '../../common/guards/policies.guard';
import { CheckPolicies } from '../auth/decorators/check-policies.decorator';
import { AppAbility } from '../auth/abilities/ability.factory';
import { Organigrama } from './entities/organigrama.entity';
import { PaginatedResult } from '../../common/utils/api-query-helper';

@ApiTags('Organigrama')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('organigrama')
export class OrganigramaController {
    constructor(private readonly organigramaService: OrganigramaService) { }

    @Get()
    @ApiOperation({ summary: 'Listar organigrama', description: 'Lista las relaciones del organigrama.' })
    @ApiResponse({ status: 200, description: 'Lista del organigrama.' })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'filter', required: false, type: Object })
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Organigrama'))
    findAll(@Query() query: ApiQueryDto): Promise<PaginatedResult<Organigrama>> {
        return this.organigramaService.list({
            limit: query.limit,
            page: query.page,
            included: query.included,
            filter: query.filter as any,
        });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener organigrama', description: 'Obtiene un registro del organigrama por ID.' })
    @ApiResponse({ status: 200, description: 'Registro encontrado.' })
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Organigrama'))
    findOne(
        @Param('id', ParseIntPipe) id: number,
        @Query('included') included?: string,
    ): Promise<Organigrama> {
        return this.organigramaService.show(id, { included });
    }

    @Post()
    @ApiOperation({ summary: 'Crear registro organigrama', description: 'Crea una nueva relación en el organigrama.' })
    @ApiResponse({ status: 201, description: 'Registro creado.' })
    @CheckPolicies((ability: AppAbility) => ability.can('create', 'Organigrama'))
    create(@Body() createDto: CreateOrganigramaDto): Promise<Organigrama> {
        return this.organigramaService.create(createDto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Actualizar organigrama', description: 'Actualiza un registro del organigrama.' })
    @ApiResponse({ status: 200, description: 'Registro actualizado.' })
    @CheckPolicies((ability: AppAbility) => ability.can('update', 'Organigrama'))
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdateOrganigramaDto,
    ): Promise<Organigrama> {
        return this.organigramaService.update(id, updateDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar organigrama', description: 'Elimina (soft delete) un registro del organigrama.' })
    @ApiResponse({ status: 200, description: 'Registro eliminado.' })
    @CheckPolicies((ability: AppAbility) => ability.can('delete', 'Organigrama'))
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.organigramaService.delete(id);
    }
}
