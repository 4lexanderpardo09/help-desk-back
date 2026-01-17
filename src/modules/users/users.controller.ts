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
     * Este endpoint centraliza todas las consultas de usuarios. Permite filtrar por múltiples
     * criterios y combinar filtros (ej: cargo + regional).
     * 
     * @param includeDepartamento "true" para incluir nombre del departamento (JOIN legacy).
     * @param departamentoId ID del departamento para filtrar.
     * @param sinDepartamento "true" para obtener usuarios SIN departamento asignado.
     * @param rolId ID del rol para filtrar (ej: 2 = Agentes).
     * @param email Email exacto para buscar un usuario específico.
     * @param cargoId ID del cargo para filtrar.
     * @param regionalId ID de la regional (requiere cargoId usualmente, o filtro general).
     * @param zona Nombre de la zona (ej: "Norte") (requiere cargoId).
     * @param includeNacional "true" para incluir usuarios marcados como nacionales (esNacional=1) al filtrar por regional.
     * @param limit Limitar la cantidad de resultados (útil para buscar uno solo con limit=1).
     */
    @Get()
    async findAllUnified(
        @Query('includeDepartamento') includeDepartamentoStr?: string,
        @Query('departamentoId') departamentoIdStr?: string,
        @Query('sinDepartamento') sinDepartamentoStr?: string,
        @Query('rolId') rolIdStr?: string,
        @Query('email') email?: string,
        @Query('cargoId') cargoIdStr?: string,
        @Query('regionalId') regionalIdStr?: string,
        @Query('zona') zona?: string,
        @Query('includeNacional') includeNacionalStr?: string,
        @Query('limit') limitStr?: string,
    ): Promise<User[] | Record<string, unknown>[]> {
        return this.usersService.findAllUnified({
            includeDepartamento: includeDepartamentoStr === 'true',
            departamentoId: sinDepartamentoStr === 'true' ? null : (departamentoIdStr ? parseInt(departamentoIdStr, 10) : undefined),
            rolId: rolIdStr ? parseInt(rolIdStr, 10) : undefined,
            email,
            cargoId: cargoIdStr ? parseInt(cargoIdStr, 10) : undefined,
            regionalId: regionalIdStr ? parseInt(regionalIdStr, 10) : undefined,
            zona,
            includeNacional: includeNacionalStr === 'true',
            limit: limitStr ? parseInt(limitStr, 10) : undefined,
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

    /**
     * @deprecated Usar GET /users?departamentoId={id}
     */
    @Get('departamento/:id')
    async findByDepartamento(
        @Param('id', ParseIntPipe) departamentoId: number,
    ): Promise<User[]> {
        return this.usersService.findAllUnified({ departamentoId }) as Promise<User[]>;
    }

    /**
     * @deprecated Usar GET /users?sinDepartamento=true
     */
    @Get('sin-departamento')
    async findWithoutDepartamento(): Promise<User[]> {
        return this.usersService.findAllUnified({ departamentoId: null }) as Promise<User[]>;
    }

    /**
     * @deprecated Usar GET /users?rolId=2
     */
    @Get('agentes')
    async findAgentes(): Promise<User[]> {
        return this.usersService.findAllUnified({ rolId: 2 }) as Promise<User[]>;
    }


    // === RUTAS CON :id (al final para evitar conflictos) ===
    /**
     * @deprecated Usar GET /users?email={email}
     */
    @Get('email/:email')
    async findByEmail(@Param('email') email: string): Promise<User | null> {
        return this.usersService.findAllUnified({ email, limit: 1 }) as Promise<User | null>;
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<User | null> {
        return this.usersService.findByIdUnified(id) as Promise<User | null>;
    }

    /**
     * Endpoint unificado para obtener usuario por ID
     * Query param: includeEmpresas=true para incluir empresas asociadas
     */
    @Get(':id/search')
    async findByIdUnified(
        @Param('id', ParseIntPipe) id: number,
        @Query('includeEmpresas') includeEmpresasStr?: string,
    ): Promise<User | Record<string, unknown> | null> {
        return this.usersService.findByIdUnified(id, {
            includeEmpresas: includeEmpresasStr === 'true',
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

