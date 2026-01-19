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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PoliciesGuard } from '../../common/guards/policies.guard';
import { CheckPolicies } from '../auth/decorators/check-policies.decorator';
import { ApiQueryDto } from '../../common/dto/api-query.dto';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class RolesController {
    constructor(private readonly rolesService: RolesService) { }

    // === RUTAS SIN PARÁMETROS ===

    @Get()
    @CheckPolicies((ability) => ability.can('read', 'Role'))
    @ApiOperation({ summary: 'Listar roles', description: 'Endpoint maestro para listar roles con filtros dinámicos y relaciones.' })
    @ApiResponse({ status: 200, description: 'Lista de roles retornada exitosamente.', type: [Role] })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Número de resultados por página' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página' })
    @ApiQuery({ name: 'filter', required: false, type: Object, description: 'Filtros dinámicos (eq, contains, etc.)' })
    @ApiQuery({ name: 'included', required: false, type: String, description: 'Relaciones a incluir (separadas por coma)' })
    list(@Query() query: ApiQueryDto) {
        return this.rolesService.list({
            limit: query.limit,
            page: query.page,
            filter: query.filter,
            included: query.included,
        });
    }

    @Post()
    @CheckPolicies((ability) => ability.can('create', 'Role'))
    @ApiOperation({ summary: 'Crear rol', description: 'Crea un nuevo rol en el sistema.' })
    @ApiResponse({ status: 201, description: 'Rol creado exitosamente.', type: Role })
    @ApiResponse({ status: 400, description: 'Datos inválidos.' })
    @ApiResponse({ status: 409, description: 'El rol ya existe.' })
    create(@Body() createRoleDto: CreateRoleDto) {
        return this.rolesService.create(createRoleDto);
    }

    // === RUTAS CON :id ===

    @Get(':id')
    @CheckPolicies((ability) => ability.can('read', 'Role'))
    @ApiOperation({ summary: 'Mostrar rol', description: 'Obtiene los detalles de un rol específico por ID.' })
    @ApiResponse({ status: 200, description: 'Rol encontrado.', type: Role })
    @ApiResponse({ status: 404, description: 'Rol no encontrado.' })
    @ApiQuery({ name: 'included', required: false, description: 'Relaciones a incluir (separadas por coma)' })
    show(
        @Param('id', ParseIntPipe) id: number,
        @Query('included') included?: string,
    ) {
        return this.rolesService.show(id, { included });
    }

    @Put(':id')
    @CheckPolicies((ability) => ability.can('update', 'Role'))
    @ApiOperation({ summary: 'Actualizar rol', description: 'Actualiza los datos de un rol existente.' })
    @ApiResponse({ status: 200, description: 'Rol actualizado exitosamente.', type: Role })
    @ApiResponse({ status: 404, description: 'Rol no encontrado.' })
    update(@Param('id', ParseIntPipe) id: number, @Body() updateRoleDto: UpdateRoleDto) {
        return this.rolesService.update(id, updateRoleDto);
    }

    @Delete(':id')
    @CheckPolicies((ability) => ability.can('delete', 'Role'))
    @ApiOperation({ summary: 'Eliminar rol', description: 'Realiza un borrado lógico del rol (estado = 0).' })
    @ApiResponse({ status: 200, description: 'Rol eliminado exitosamente.' })
    @ApiResponse({ status: 404, description: 'Rol no encontrado.' })
    delete(@Param('id', ParseIntPipe) id: number) {
        return this.rolesService.delete(id);
    }
}
