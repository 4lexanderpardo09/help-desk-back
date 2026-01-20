import { Injectable, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { PermissionsService } from '../permissions/permissions.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly usersService: UsersService,
        @Inject(forwardRef(() => PermissionsService))
        private readonly permissionsService: PermissionsService,
    ) { }

    /**
     * Valida credenciales y genera token JWT
     */
    async login(
        email: string,
        password: string,
    ): Promise<{ accessToken: string }> {
        const user = await this.usersService.findByEmailWithPassword(email);

        if (!user) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        // Verificar password
        // El sistema legacy puede usar MD5 o bcrypt, verificamos ambos
        const isPasswordValid = await this.verifyPassword(password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        const payload: JwtPayload = {
            usu_id: user.id,
            usu_correo: user.email,
            rol_id: user.rolId,
            reg_id: user.regionalId,
            car_id: user.cargoId,
            dp_id: user.departamentoId,
            es_nacional: user.esNacional
        };

        return {
            accessToken: this.jwtService.sign(payload),
        };
    }

    /**
     * Verifica password - soporta bcrypt de PHP ($2y$) y Node.js ($2a$), y MD5
     */
    private async verifyPassword(
        plainPassword: string,
        hashedPassword: string,
    ): Promise<boolean> {
        // Verificar si es bcrypt (empieza con $2)
        if (hashedPassword.startsWith('$2')) {
            // PHP usa $2y$, Node.js bcrypt usa $2a$ - son compatibles, solo hay que convertir
            const normalizedHash = hashedPassword.replace(/^\$2y\$/, '$2a$');
            return bcrypt.compare(plainPassword, normalizedHash);
        }

        // Verificar si es MD5 (32 caracteres hex)
        if (hashedPassword.length === 32) {
            const crypto = await import('crypto');
            const md5Hash = crypto
                .createHash('md5')
                .update(plainPassword)
                .digest('hex');
            return md5Hash === hashedPassword;
        }

        // Comparación directa (sin hash - no recomendado pero posible en sistemas legacy)
        return plainPassword === hashedPassword;
    }

    /**
     * Verifica si un token es válido
     */
    verifyToken(token: string): JwtPayload {
        return this.jwtService.verify<JwtPayload>(token);
    }

    /**
     * Obtiene el perfil completo del usuario con detalles y permisos
     */
    async getFullProfile(user: JwtPayload): Promise<any> {
        // 1. Obtener detalles básicos del usuario (Nombre, Apellido, etc) e incluir relaciones útiles
        // Definimos los scopes que queremos traer para el perfil completo
        const userDetails = await this.usersService.show(user.usu_id, {
            included: 'role,cargo,regional,departamento'
        });

        if (!userDetails) {
            throw new UnauthorizedException('Usuario no encontrado');
        }

        // 2. Obtener permisos del rol
        let permissions: import('../permissions/permissions.service').CachedPermission[] = [];
        if (user.rol_id) {
            const perms = await this.permissionsService.getPermissionsForRole(user.rol_id);
            // Transformar a formato simple si es necesario, o devolver CachedPermission directo
            permissions = perms;
        }

        // 3. Combinar respuesta
        return {
            ...user, // Payload original (ids)
            nombre: userDetails.nombre,
            apellido: userDetails.apellido,
            permissions: permissions,
            role: userDetails.role,
            cargo: userDetails.cargo,
            regional: userDetails.regional,
            departamento: userDetails.departamento
        };
    }
}
