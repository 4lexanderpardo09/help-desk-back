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
    // === RUTAS SIN PARÁMETROS ===

    /**
     * Endpoint unificado para listar usuarios
     * Query param: includeDepartamento=true para ejecutar SP legacy con JOINs
     */
    /**
     * **MASTER ENDPOINT**: Listado y búsqueda unificada de usuarios.
     * 
     * Soporta filtrado avanzado mediante "Scopes" dinámicos (ApiQueryHelper).
     * 
     * @param limit Limitar resultados.
     * @param included Relaciones a incluir (ej: 'regional,cargo').
     * @param filter Filtros dinámicos (ej: filter[email]=x).
     */
    @Get()
    async findAllUnified(
        @Query() query: ApiQueryDto,
    ): Promise<User[] | Record<string, unknown>[]> {
        return this.usersService.findAllUnified({
            limit: query.limit,
            included: query.included,
            filter: query.filter,
        }) as Promise<User[] | Record<string, unknown>[]>;
    }

    @Post()
    async create(@Body() createUserDto: CreateUserDto): Promise<User> {
        return this.usersService.create(createUserDto);
    }

    @Post('by-ids')
    async findByIds(
        @Body('ids') ids: number[],
    ): Promise<Record<string, unknown>[]> {
        return this.usersService.findByIds(ids);
    }








    // === RUTAS CON :id (al final para evitar conflictos) ===


    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<User | null> {
        return this.usersService.findByIdUnified(id) as Promise<User | null>;
    }

    /**
     * Endpoint unificado para obtener usuario por ID
     * Incluye relaciones 'empresaUsuarios' por defecto.
     */
    @Get(':id/search')
    async getByIdWithOptions(@Param('id') id: string) {
        return this.usersService.findByIdUnified(+id, {
            included: 'empresaUsuarios',
        });
    }



    @Put(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateUserDto: UpdateUserDto,
    ): Promise<User> {
        return this.usersService.update(id, updateUserDto);
    }

    @Delete(':id')
    async delete(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<{ deleted: boolean; id: number }> {
        return this.usersService.delete(id);
    }

    @Put(':id/firma')
    async updateFirma(
        @Param('id', ParseIntPipe) id: number,
        @Body('firma') firma: string,
    ): Promise<{ updated: boolean; id: number }> {
        return this.usersService.updateFirma(id, firma);
    }

    @Put(':id/perfiles')
    async syncPerfiles(
        @Param('id', ParseIntPipe) id: number,
        @Body('perfilIds') perfilIds: number[],
    ): Promise<{ synced: boolean; userId: number; perfilCount: number }> {
        return this.usersService.syncPerfiles(id, perfilIds);
    }

    @Get(':id/perfiles')
    async getPerfiles(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<Record<string, unknown>[]> {
        return this.usersService.getPerfiles(id);
    }
}

