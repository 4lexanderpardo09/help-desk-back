import {
    Controller,
    Get,
    Put,
    Post,
    Delete,
    Param,
    Body,
    ParseIntPipe,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { Permission } from './entities/permission.entity';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PoliciesGuard } from '../../common/guards/policies.guard';
import { CheckPolicies } from '../auth/decorators/check-policies.decorator';

import { SyncRolePermissionsDto } from './dto/sync-role-permissions.dto';

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('permissions')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class PermissionsController {
    constructor(private readonly permissionsService: PermissionsService) { }

    // ========================================
    // CATÁLOGO DE PERMISOS
    // ========================================

    /**
     * GET /permissions
     * Lista todos los permisos disponibles en el sistema
     */
    @Get()
    @CheckPolicies((ability) => ability.can('read', 'Permission'))
    @ApiOperation({ summary: 'Listar permisos', description: 'Obtiene el catálogo completo de permisos disponibles.' })
    @ApiResponse({ status: 200, description: 'Lista de permisos.' })
    async findAll(): Promise<Permission[]> {
        return this.permissionsService.findAllPermissions();
    }

    // ========================================
    // PERMISOS POR ROL
    // ========================================

    /**
     * GET /permissions/role/:rolId
     * Obtiene los permisos asignados a un rol específico
     */
    @Get('role/:rolId')
    @CheckPolicies((ability) => ability.can('read', 'Permission'))
    @ApiOperation({ summary: 'Permisos por rol', description: 'Obtiene los permisos asignados a un rol.' })
    @ApiParam({ name: 'rolId', description: 'ID del rol' })
    @ApiResponse({ status: 200, description: 'Lista de permisos del rol.' })
    async findByRole(@Param('rolId', ParseIntPipe) rolId: number): Promise<Permission[]> {
        return this.permissionsService.findPermissionsByRole(rolId);
    }

    /**
     * PUT /permissions/role/:rolId
     * Sincroniza los permisos de un rol (reemplaza todos los existentes)
     */
    @Put('role/:rolId')
    @CheckPolicies((ability) => ability.can('update', 'Permission'))
    @ApiOperation({ summary: 'Sincronizar permisos de rol', description: 'Reemplaza todos los permisos de un rol con los nuevos.' })
    @ApiParam({ name: 'rolId', description: 'ID del rol' })
    @ApiResponse({ status: 200, description: 'Permisos sincronizados.' })
    async syncRolePermissions(
        @Param('rolId', ParseIntPipe) rolId: number,
        @Body() dto: SyncRolePermissionsDto,
    ): Promise<{ synced: boolean; rolId: number; count: number }> {
        return this.permissionsService.syncRolePermissions(rolId, dto.permisoIds);
    }

    /**
     * POST /permissions/role/:rolId/:permisoId
     * Agrega un permiso específico a un rol
     */
    @Post('role/:rolId/:permisoId')
    @CheckPolicies((ability) => ability.can('update', 'Permission'))
    @ApiOperation({ summary: 'Agregar permiso a rol', description: 'Agrega un permiso específico a un rol.' })
    @ApiParam({ name: 'rolId', description: 'ID del rol' })
    @ApiParam({ name: 'permisoId', description: 'ID del permiso' })
    @ApiResponse({ status: 201, description: 'Permiso agregado.' })
    async addPermissionToRole(
        @Param('rolId', ParseIntPipe) rolId: number,
        @Param('permisoId', ParseIntPipe) permisoId: number,
    ) {
        return this.permissionsService.addPermissionToRole(rolId, permisoId);
    }

    /**
     * DELETE /permissions/role/:rolId/:permisoId
     * Remueve un permiso de un rol
     */
    @Delete('role/:rolId/:permisoId')
    @CheckPolicies((ability) => ability.can('update', 'Permission'))
    @ApiOperation({ summary: 'Remover permiso de rol', description: 'Remueve un permiso específico de un rol.' })
    @ApiParam({ name: 'rolId', description: 'ID del rol' })
    @ApiParam({ name: 'permisoId', description: 'ID del permiso' })
    @ApiResponse({ status: 200, description: 'Permiso removido.' })
    async removePermissionFromRole(
        @Param('rolId', ParseIntPipe) rolId: number,
        @Param('permisoId', ParseIntPipe) permisoId: number,
    ): Promise<{ removed: boolean }> {
        return this.permissionsService.removePermissionFromRole(rolId, permisoId);
    }

    // ========================================
    // CACHÉ (ADMIN)
    // ========================================

    /**
     * GET /permissions/cache/status
     * Obtiene el estado del caché de permisos
     */
    @Get('cache/status')
    @CheckPolicies((ability) => ability.can('manage', 'Permission'))
    @ApiOperation({ summary: 'Estado del caché', description: 'Obtiene información sobre el caché de permisos.' })
    @ApiResponse({ status: 200, description: 'Estado del caché.' })
    getCacheStatus() {
        return this.permissionsService.getCacheStatus();
    }

    /**
     * POST /permissions/cache/refresh
     * Fuerza un refresh del caché de permisos
     */
    @Post('cache/refresh')
    @CheckPolicies((ability) => ability.can('manage', 'Permission'))
    @ApiOperation({ summary: 'Refrescar caché', description: 'Fuerza un refresh completo del caché de permisos.' })
    @ApiResponse({ status: 201, description: 'Caché refrescado.' })
    async refreshCache() {
        await this.permissionsService.refreshAllCache();
        return { refreshed: true, ...this.permissionsService.getCacheStatus() };
    }
}
