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
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ApiQueryDto } from '../../common/dto/api-query.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PoliciesGuard } from '../../common/guards/policies.guard';
import { CheckPolicies } from '../auth/decorators/check-policies.decorator';
import { AppAbility } from '../auth/abilities/ability.factory';

@ApiTags('Profiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('profiles')
export class ProfilesController {
    constructor(private readonly profilesService: ProfilesService) { }

    /**
     * GET /profiles
     * 
     * Listar perfiles con paginación y filtros.
     * 
     * @authorization Requiere `read` sobre `Profile`
     */
    @Get()
    @ApiOperation({ summary: 'Listar perfiles', description: 'Endpoint para listar perfiles con filtros dinámicos.' })
    @ApiResponse({ status: 200, description: 'Lista de perfiles.' })
    @ApiResponse({ status: 401, description: 'No autorizado.' })
    @ApiResponse({ status: 403, description: 'Permisos insuficientes.' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Límite de resultados por página.' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página actual.' })
    @ApiQuery({ name: 'included', required: false, type: String, description: 'Relaciones a incluir (ej: usuarioPerfiles).' })
    @ApiQuery({ name: 'filter[nombre]', required: false, type: String, description: 'Filtrar por nombre (LIKE).' })
    @ApiQuery({ name: 'filter[estado]', required: false, type: Number, description: 'Filtrar por estado (1=Activo, 0=Inactivo).' })
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Profile'))
    findAll(@Query() query: ApiQueryDto) {
        return this.profilesService.list({
            limit: query.limit,
            page: query.page,
            included: query.included,
            filter: query.filter as any,
        });
    }

    /**
     * GET /profiles/:id
     * 
     * Obtiene el detalle de un perfil por su ID.
     * 
     * @authorization Requiere `read` sobre `Profile`
     */
    @Get(':id')
    @ApiOperation({ summary: 'Obtener perfil', description: 'Obtiene los detalles de un perfil específico por ID.' })
    @ApiResponse({ status: 200, description: 'Perfil encontrado.' })
    @ApiResponse({ status: 404, description: 'Perfil no encontrado.' })
    @ApiQuery({ name: 'included', required: false, type: String, description: 'Relaciones a incluir.' })
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Profile'))
    findOne(
        @Param('id', ParseIntPipe) id: number,
        @Query('included') included?: string,
    ) {
        return this.profilesService.show(id, { included });
    }

    /**
     * POST /profiles
     * 
     * Crea un nuevo perfil en el sistema.
     * 
     * @authorization Requiere `create` sobre `Profile`
     */
    @Post()
    @ApiOperation({ summary: 'Crear perfil', description: 'Crea un nuevo perfil.' })
    @ApiResponse({ status: 201, description: 'Perfil creado exitosamente.' })
    @ApiResponse({ status: 409, description: 'El nombre del perfil ya existe.' })
    @CheckPolicies((ability: AppAbility) => ability.can('create', 'Profile'))
    create(@Body() createProfileDto: CreateProfileDto) {
        return this.profilesService.create(createProfileDto);
    }

    /**
     * PUT /profiles/:id
     * 
     * Actualiza un perfil existente.
     * 
     * @authorization Requiere `update` sobre `Profile`
     */
    @Put(':id')
    @ApiOperation({ summary: 'Actualizar perfil', description: 'Actualiza los datos de un perfil existente.' })
    @ApiResponse({ status: 200, description: 'Perfil actualizado.' })
    @ApiResponse({ status: 404, description: 'Perfil no encontrado.' })
    @CheckPolicies((ability: AppAbility) => ability.can('update', 'Profile'))
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateProfileDto: UpdateProfileDto,
    ) {
        return this.profilesService.update(id, updateProfileDto);
    }

    /**
     * DELETE /profiles/:id
     * 
     * Realiza un borrado lógico (Soft Delete) del perfil.
     * 
     * @authorization Requiere `delete` sobre `Profile`
     */
    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar perfil', description: 'Marca el perfil como eliminado (estado=0).' })
    @ApiResponse({ status: 200, description: 'Perfil eliminado.' })
    @ApiResponse({ status: 404, description: 'Perfil no encontrado.' })
    @CheckPolicies((ability: AppAbility) => ability.can('delete', 'Profile'))
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.profilesService.delete(id);
    }

    // ========================================
    // ENDPOINTS PARA USUARIOS-PERFILES
    // ========================================

    /**
     * GET /profiles/user/:userId
     * 
     * Lista los perfiles asignados a un usuario usando filter[usuarioId].
     * 
     * @authorization Requiere `read` sobre `Profile`
     */
    @Get('user/:userId')
    @ApiOperation({ summary: 'Perfiles de usuario', description: 'Lista los perfiles asignados a un usuario.' })
    @ApiResponse({ status: 200, description: 'Lista de perfiles del usuario.' })
    @CheckPolicies((ability: AppAbility) => ability.can('read', 'Profile'))
    listByUser(@Param('userId', ParseIntPipe) userId: number) {
        return this.profilesService.list({ filter: { usuarioId: userId } });
    }

    /**
     * PUT /profiles/user/:userId
     * 
     * Sincroniza (reemplaza) los perfiles de un usuario.
     * 
     * @authorization Requiere `update` sobre `Profile`
     */
    @Put('user/:userId')
    @ApiOperation({ summary: 'Sincronizar perfiles', description: 'Reemplaza todos los perfiles de un usuario.' })
    @ApiResponse({ status: 200, description: 'Perfiles sincronizados.' })
    @CheckPolicies((ability: AppAbility) => ability.can('update', 'Profile'))
    syncUserProfiles(
        @Param('userId', ParseIntPipe) userId: number,
        @Body('perfilIds') perfilIds: number[],
    ) {
        return this.profilesService.syncUserProfiles(userId, perfilIds);
    }
}

