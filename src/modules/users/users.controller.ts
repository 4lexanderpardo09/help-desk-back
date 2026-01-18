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
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiQueryDto } from '../../common/dto/api-query.dto';

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
    async findAllUnified(
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
    async create(@Body() createUserDto: CreateUserDto): Promise<User> {
        return this.usersService.create(createUserDto);
    }

    // === RUTAS CON :id (al final para evitar conflictos) ===

    /**
     * GET /users/:id
     * Obtiene un usuario por ID.
     */
    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<User | null> {
        return this.usersService.show(id);
    }

    /**
     * PUT /users/:id
     * Actualiza datos básicos de un usuario.
     */
    @Put(':id')
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
    async getPerfiles(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<Record<string, unknown>[]> {
        return this.usersService.getPerfiles(id);
    }
}

