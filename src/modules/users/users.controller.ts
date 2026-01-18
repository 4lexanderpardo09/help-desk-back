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
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiQueryDto } from '../../common/dto/api-query.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    // === RUTAS SIN PARÁMETROS ===

    /**
     * GET /users
     * 
     * **MASTER ENDPOINT**: Listado y búsqueda unificada de usuarios.
     * Soporta filtrado avanzado (ApiQueryHelper) y Arrays en filtros ID.
     */
    @Get()
    @ApiOperation({ summary: 'Listar usuarios', description: 'Endpoint maestro para listar usuarios con filtros dinámicos y relaciones.' })
    @ApiQuery({ name: 'included', required: false, description: 'Relaciones a incluir (separadas por coma). Ej: regional,cargo,departamento' })
    @ApiQuery({ name: 'filter[id]', required: false, description: 'Filtrar por ID(s). Soporta CSV: 1,2,3' })
    @ApiQuery({ name: 'filter[rolId]', required: false, description: 'Filtrar por rol' })
    @ApiQuery({ name: 'filter[email]', required: false, description: 'Filtrar por email (LIKE)' })
    @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados' })
    @ApiResponse({ status: 200, description: 'Lista de usuarios.' })
    @ApiResponse({ status: 401, description: 'No autorizado.' })
    async list(
        @Query() query: ApiQueryDto,
    ): Promise<User[] | Record<string, unknown>[]> {
        return this.usersService.list({
            limit: query.limit,
            included: query.included,
            filter: query.filter,
        }) as Promise<User[] | Record<string, unknown>[]>;
    }

    /**
     * POST /users
     * Crea un nuevo usuario.
     */
    @Post()
    @ApiOperation({ summary: 'Crear usuario', description: 'Crea un nuevo usuario en el sistema.' })
    @ApiResponse({ status: 201, description: 'Usuario creado exitosamente.' })
    @ApiResponse({ status: 400, description: 'Datos inválidos.' })
    @ApiResponse({ status: 409, description: 'Email ya registrado.' })
    async create(@Body() createUserDto: CreateUserDto): Promise<User> {
        return this.usersService.create(createUserDto);
    }

    // === RUTAS CON :id (al final para evitar conflictos) ===

    /**
     * GET /users/:id
     * Obtiene un usuario por ID con relaciones opcionales.
     */
    @Get(':id')
    @ApiOperation({ summary: 'Mostrar usuario', description: 'Obtiene los detalles de un usuario específico por ID. Soporta eager loading de relaciones.' })
    @ApiParam({ name: 'id', description: 'ID del usuario' })
    @ApiQuery({ name: 'included', required: false, description: 'Relaciones a incluir (separadas por coma). Ej: regional,cargo,role' })
    @ApiResponse({ status: 200, description: 'Usuario encontrado.' })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
    async show(
        @Param('id', ParseIntPipe) id: number,
        @Query('included') included?: string,
    ): Promise<User | null> {
        return this.usersService.show(id, { included });
    }

    /**
     * PUT /users/:id
     * Actualiza datos básicos de un usuario.
     */
    @Put(':id')
    @ApiOperation({ summary: 'Actualizar usuario', description: 'Actualiza los datos de un usuario existente.' })
    @ApiParam({ name: 'id', description: 'ID del usuario a actualizar' })
    @ApiResponse({ status: 200, description: 'Usuario actualizado.' })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
    @ApiResponse({ status: 409, description: 'Email ya en uso.' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateUserDto: UpdateUserDto,
    ): Promise<User> {
        return this.usersService.update(id, updateUserDto);
    }

    /**
     * DELETE /users/:id
     * Elimina un usuario (Soft Delete).
     */
    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar usuario', description: 'Soft delete: marca estado=0 sin eliminar físicamente.' })
    @ApiParam({ name: 'id', description: 'ID del usuario a eliminar' })
    @ApiResponse({ status: 200, description: 'Usuario eliminado.' })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
    async delete(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<{ deleted: boolean; id: number }> {
        return this.usersService.delete(id);
    }

    /**
     * PUT /users/:id/firma
     * Actualiza la firma del usuario.
     */
    @Put(':id/firma')
    @ApiOperation({ summary: 'Actualizar firma', description: 'Actualiza la ruta de la firma del usuario.' })
    @ApiParam({ name: 'id', description: 'ID del usuario' })
    @ApiResponse({ status: 200, description: 'Firma actualizada.' })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
    async updateFirma(
        @Param('id', ParseIntPipe) id: number,
        @Body('firma') firma: string,
    ): Promise<{ updated: boolean; id: number }> {
        return this.usersService.updateFirma(id, firma);
    }

    /**
     * PUT /users/:id/perfiles
     * Sincroniza los perfiles asignados a un usuario.
     */
    @Put(':id/perfiles')
    @ApiOperation({ summary: 'Sincronizar perfiles', description: 'Reemplaza los perfiles del usuario con los nuevos IDs proporcionados.' })
    @ApiParam({ name: 'id', description: 'ID del usuario' })
    @ApiResponse({ status: 200, description: 'Perfiles sincronizados.' })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
    async syncPerfiles(
        @Param('id', ParseIntPipe) id: number,
        @Body('perfilIds') perfilIds: number[],
    ): Promise<{ synced: boolean; userId: number; perfilCount: number }> {
        return this.usersService.syncPerfiles(id, perfilIds);
    }

    /**
     * GET /users/:id/perfiles
     * Obtiene los perfiles de un usuario.
     */
    @Get(':id/perfiles')
    @ApiOperation({ summary: 'Listar perfiles del usuario', description: 'Devuelve los perfiles asignados a un usuario.' })
    @ApiParam({ name: 'id', description: 'ID del usuario' })
    @ApiResponse({ status: 200, description: 'Lista de perfiles.' })
    async getPerfiles(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<Record<string, unknown>[]> {
        return this.usersService.getPerfiles(id);
    }
}
