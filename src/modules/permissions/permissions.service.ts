import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';

/**
 * Estructura de permiso simplificada para CASL
 */
export interface CachedPermission {
    action: string;
    subject: string;
}

/**
 * PermissionsService - Gestión de permisos dinámicos con caché
 * 
 * Centraliza la lógica de permisos y mantiene un caché en memoria
 * para evitar consultas a BD en cada request.
 * 
 * El caché se puede invalidar manualmente cuando se modifican permisos.
 */
@Injectable()
export class PermissionsService {
    private readonly logger = new Logger(PermissionsService.name);

    /**
     * Caché de permisos por rol
     * Estructura: Map<rolId, CachedPermission[]>
     */
    private permissionsCache: Map<number, CachedPermission[]> = new Map();

    /**
     * Timestamp del último refresh del caché (para debugging)
     */
    private lastCacheRefresh: Date | null = null;

    constructor(
        @InjectRepository(Permission)
        private readonly permissionRepository: Repository<Permission>,
        @InjectRepository(RolePermission)
        private readonly rolePermissionRepository: Repository<RolePermission>,
    ) {
        // Cargar caché al iniciar
        this.refreshAllCache();
    }

    // ========================================
    // CACHÉ
    // ========================================

    /**
     * Obtiene los permisos de un rol desde el caché
     * Si no está en caché, lo carga de BD
     */
    async getPermissionsForRole(rolId: number): Promise<CachedPermission[]> {
        if (!this.permissionsCache.has(rolId)) {
            await this.loadRolePermissions(rolId);
        }
        return this.permissionsCache.get(rolId) || [];
    }

    /**
     * Carga permisos de un rol específico desde BD al caché
     */
    private async loadRolePermissions(rolId: number): Promise<void> {
        const rolePermissions = await this.rolePermissionRepository.find({
            where: { rolId, estado: 1 },
            relations: ['permission'],
        });

        const permissions: CachedPermission[] = rolePermissions
            .filter((rp) => rp.permission && rp.permission.estado === 1)
            .map((rp) => ({
                action: rp.permission.action,
                subject: rp.permission.subject,
            }));

        this.permissionsCache.set(rolId, permissions);
        this.logger.debug(`Cached ${permissions.length} permissions for role ${rolId}`);
    }

    /**
     * Recarga el caché completo de todos los roles
     */
    async refreshAllCache(): Promise<void> {
        this.logger.log('Refreshing permissions cache...');
        this.permissionsCache.clear();

        const allRolePermissions = await this.rolePermissionRepository.find({
            where: { estado: 1 },
            relations: ['permission'],
        });

        // Agrupar por rol
        const grouped = new Map<number, CachedPermission[]>();
        for (const rp of allRolePermissions) {
            if (!rp.permission || rp.permission.estado !== 1) continue;

            if (!grouped.has(rp.rolId)) {
                grouped.set(rp.rolId, []);
            }
            grouped.get(rp.rolId)!.push({
                action: rp.permission.action,
                subject: rp.permission.subject,
            });
        }

        this.permissionsCache = grouped;
        this.lastCacheRefresh = new Date();
        this.logger.log(`Permissions cache refreshed: ${grouped.size} roles loaded`);
    }

    /**
     * Invalida el caché de un rol específico
     */
    invalidateCacheForRole(rolId: number): void {
        this.permissionsCache.delete(rolId);
        this.logger.debug(`Cache invalidated for role ${rolId}`);
    }

    /**
     * Obtiene info del estado del caché (para debugging/admin)
     */
    getCacheStatus(): { rolesInCache: number; lastRefresh: Date | null } {
        return {
            rolesInCache: this.permissionsCache.size,
            lastRefresh: this.lastCacheRefresh,
        };
    }

    // ========================================
    // CRUD DE PERMISOS
    // ========================================

    /**
     * Lista todos los permisos disponibles
     */
    async findAllPermissions(): Promise<Permission[]> {
        return this.permissionRepository.find({
            where: { estado: 1 },
            order: { subject: 'ASC', action: 'ASC' },
        });
    }

    /**
     * Obtiene los permisos asignados a un rol específico
     */
    async findPermissionsByRole(rolId: number): Promise<Permission[]> {
        const rolePermissions = await this.rolePermissionRepository.find({
            where: { rolId, estado: 1 },
            relations: ['permission'],
        });

        return rolePermissions
            .filter((rp) => rp.permission && rp.permission.estado === 1)
            .map((rp) => rp.permission);
    }

    /**
     * Asigna permisos a un rol (reemplaza los existentes)
     * @param rolId - ID del rol
     * @param permisoIds - Array de IDs de permisos a asignar
     */
    async syncRolePermissions(
        rolId: number,
        permisoIds: number[],
    ): Promise<{ synced: boolean; rolId: number; count: number }> {
        // 1. Eliminar permisos existentes del rol
        await this.rolePermissionRepository.delete({ rolId });

        // 2. Insertar nuevos permisos
        if (permisoIds && permisoIds.length > 0) {
            const newRolePermissions = permisoIds.map((permisoId) =>
                this.rolePermissionRepository.create({
                    rolId,
                    permisoId,
                    estado: 1,
                }),
            );
            await this.rolePermissionRepository.save(newRolePermissions);
        }

        // 3. Invalidar caché del rol
        this.invalidateCacheForRole(rolId);

        return { synced: true, rolId, count: permisoIds?.length || 0 };
    }

    /**
     * Agrega un permiso específico a un rol
     */
    async addPermissionToRole(rolId: number, permisoId: number): Promise<RolePermission> {
        const existing = await this.rolePermissionRepository.findOne({
            where: { rolId, permisoId },
        });

        if (existing) {
            if (existing.estado === 0) {
                existing.estado = 1;
                await this.rolePermissionRepository.save(existing);
                this.invalidateCacheForRole(rolId);
                return existing;
            }
            return existing; // Ya existe y está activo
        }

        const newRolePermission = this.rolePermissionRepository.create({
            rolId,
            permisoId,
            estado: 1,
        });
        const saved = await this.rolePermissionRepository.save(newRolePermission);
        this.invalidateCacheForRole(rolId);
        return saved;
    }

    /**
     * Remueve un permiso de un rol
     */
    async removePermissionFromRole(rolId: number, permisoId: number): Promise<{ removed: boolean }> {
        const result = await this.rolePermissionRepository.delete({ rolId, permisoId });
        this.invalidateCacheForRole(rolId);
        return { removed: (result.affected || 0) > 0 };
    }
}
