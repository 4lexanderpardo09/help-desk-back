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
    @Get()
    async findAll(): Promise<User[]> {
        return this.usersService.findAll();
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

    // === RUTAS CON PREFIJOS ESPECÍFICOS (antes de :id) ===
    @Get('with-departamento')
    async getAllWithDepartamento(): Promise<Record<string, unknown>[]> {
        return this.usersService.getAllWithDepartamento();
    }

    @Get('departamento/:id')
    async findByDepartamento(
        @Param('id', ParseIntPipe) departamentoId: number,
    ): Promise<User[]> {
        return this.usersService.findByDepartamento(departamentoId);
    }

    @Get('sin-departamento')
    async findWithoutDepartamento(): Promise<User[]> {
        return this.usersService.findByDepartamento(null);
    }

    @Get('email/:email')
    async findByEmail(@Param('email') email: string): Promise<User | null> {
        return this.usersService.findByEmail(email);
    }

    /**
     * Endpoint unificado para buscar usuarios por cargo
     * Query params:
     * - regionalId: (opcional) filtrar por regional
     * - zona: (opcional) filtrar por nombre de zona
     * - includeNacional: (opcional) incluir usuarios nacionales si se filtra por regional
     * - limit: (opcional) 1 para retornar solo uno
     */
    @Get('cargo/:cargoId/search')
    async findByCargoUnified(
        @Param('cargoId', ParseIntPipe) cargoId: number,
        @Query('regionalId') regionalIdStr?: string,
        @Query('zona') zona?: string,
        @Query('includeNacional') includeNacionalStr?: string,
        @Query('limit') limitStr?: string,
    ): Promise<User[] | User | null> {
        return this.usersService.findByCargoUnified({
            cargoId,
            regionalId: regionalIdStr ? parseInt(regionalIdStr, 10) : undefined,
            zona,
            includeNacional: includeNacionalStr === 'true',
            limit: limitStr ? parseInt(limitStr, 10) : undefined,
        });
    }

    // ===============================================
    // ENDPOINTS LEGACY (usar /cargo/:cargoId/search en su lugar)
    // ===============================================

    @Get('cargo/:id')
    async findByCargo(
        @Param('id', ParseIntPipe) cargoId: number,
    ): Promise<Record<string, unknown>[]> {
        return this.usersService.findByCargo(cargoId);
    }

    @Get('cargo/:cargoId/regional/:regionalId')
    async findByCargoAndRegional(
        @Param('cargoId', ParseIntPipe) cargoId: number,
        @Param('regionalId', ParseIntPipe) regionalId: number,
    ): Promise<User | null> {
        return this.usersService.findByCargoAndRegional(cargoId, regionalId);
    }

    @Get('cargo/:cargoId/regional/:regionalId/all')
    async findAllByCargoAndRegional(
        @Param('cargoId', ParseIntPipe) cargoId: number,
        @Param('regionalId', ParseIntPipe) regionalId: number,
    ): Promise<User[]> {
        return this.usersService.findAllByCargoAndRegional(cargoId, regionalId);
    }

    @Get('cargo/:id/one')
    async findOneByCargo(
        @Param('id', ParseIntPipe) cargoId: number,
    ): Promise<User | null> {
        return this.usersService.findOneByCargo(cargoId);
    }

    @Get('cargo/:cargoId/regional-or-nacional/:regionalId')
    async findByCargoRegionalOrNacional(
        @Param('cargoId', ParseIntPipe) cargoId: number,
        @Param('regionalId', ParseIntPipe) regionalId: number,
    ): Promise<User[]> {
        return this.usersService.findByCargoRegionalOrNacional(cargoId, regionalId);
    }

    @Get('cargo/:cargoId/zona/:zona')
    async findByCargoAndZona(
        @Param('cargoId', ParseIntPipe) cargoId: number,
        @Param('zona') zona: string,
    ): Promise<Record<string, unknown> | null> {
        return this.usersService.findByCargoAndZona(cargoId, zona);
    }

    @Get('rol/:id')
    async findByRol(
        @Param('id', ParseIntPipe) rolId: number,
    ): Promise<User[]> {
        return this.usersService.findByRol(rolId);
    }

    @Get('agentes')
    async findAgentes(): Promise<User[]> {
        return this.usersService.findAgentes();
    }

    // === RUTAS CON :id (al final para evitar conflictos) ===
    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<User | null> {
        return this.usersService.findById(id);
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

    // ===============================================
    // ENDPOINTS LEGACY (usar /:id/search en su lugar)
    // ===============================================

    @Get(':id/with-empresas')
    async findByIdWithEmpresas(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<Record<string, unknown> | null> {
        return this.usersService.findByIdWithEmpresas(id);
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

