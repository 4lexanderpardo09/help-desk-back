import { Injectable, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { PermissionsService } from '../permissions/permissions.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';

/**
 * Servicio encargado de la lógica de autenticación, validación de credenciales
 * y gestión de perfiles de usuario.
 */
@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly usersService: UsersService,
        @Inject(forwardRef(() => PermissionsService))
        private readonly permissionsService: PermissionsService,
    ) { }

    /**
     * Autentica a un usuario, valida sus perfiles activos y genera un token JWT.
     * * @param email Correo electrónico del usuario.
     * @param password Contraseña en texto plano.
     * @returns Objeto con el `accessToken` generado.
     * @throws {UnauthorizedException} Si las credenciales son incorrectas o el usuario no existe.
     */
    async login(
        email: string,
        password: string,
    ): Promise<{ accessToken: string }> {
        const user = await this.usersService.findByEmailWithPassword(email);

        if (!user) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        // Validación de contraseña multiformato (Legacy/Modern)
        const isPasswordValid = await this.verifyPassword(password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        // Filtrado de perfiles: Solo aquellos con estado activo (1)
        const usuarioPerfiles = user.usuarioPerfiles || [];
        const perfilIds = usuarioPerfiles
            .filter(up => up.estado === 1)
            .map(up => up.perfilId);

        // Construcción del Payload con información contextual
        const payload: JwtPayload = {
            usu_id: user.id,
            usu_correo: user.email,
            rol_id: user.rolId,
            reg_id: user.regionalId,
            car_id: user.cargoId,
            dp_id: user.departamentoId,
            es_nacional: user.esNacional,
            perfil_ids: perfilIds
        };

        return {
            accessToken: this.jwtService.sign(payload),
        };
    }

    /**
     * Verifica la contraseña comparándola con el hash almacenado.
     * Soporta tres formatos:
     * 1. **Bcrypt Moderno**: Identifica prefijos `$2y$` (PHP) y los normaliza a `$2a$` (Node.js).
     * 2. **Legacy MD5**: Identifica hashes de 32 caracteres.
     * 3. **Texto Plano**: fallback para sistemas extremadamente antiguos (no recomendado).
     * * @param plainPassword Contraseña ingresada por el usuario.
     * @param hashedPassword Hash recuperado de la base de datos.
     * @private
     */
    private async verifyPassword(
        plainPassword: string,
        hashedPassword: string,
    ): Promise<boolean> {
        // Caso Bcrypt: Normalización de versiones entre PHP y Node.js
        if (hashedPassword.startsWith('$2')) {
            const normalizedHash = hashedPassword.replace(/^\$2y\$/, '$2a$');
            return bcrypt.compare(plainPassword, normalizedHash);
        }

        // Caso Legacy MD5
        if (hashedPassword.length === 32) {
            const crypto = await import('crypto');
            const md5Hash = crypto
                .createHash('md5')
                .update(plainPassword)
                .digest('hex');
            return md5Hash === hashedPassword;
        }

        // Fallback: Comparación directa
        return plainPassword === hashedPassword;
    }

    /**
     * Verifica la integridad y vigencia de un token JWT.
     * @param token String del JWT.
     * @returns Payload decodificado si es válido.
     */
    verifyToken(token: string): JwtPayload {
        return this.jwtService.verify<JwtPayload>(token);
    }

    /**
     * Construye un perfil detallado combinando datos de usuario, relaciones y permisos.
     * Útil para la carga inicial del Frontend (E.g. en un Store de Redux/Pinia).
     * * @param user Payload básico extraído del token.
     * @returns Objeto enriquecido con nombres, cargos, regionales y lista de permisos.
     * @throws {UnauthorizedException} Si no se encuentra el detalle del usuario.
     */
    async getFullProfile(user: JwtPayload): Promise<any> {
        // Recuperar detalles extendidos de la base de datos
        const userDetails = await this.usersService.show(user.usu_id, {
            included: 'role,cargo,regional,departamento'
        });

        if (!userDetails) {
            throw new UnauthorizedException('Usuario no encontrado');
        }

        // Resolución de permisos asociados al Rol del usuario
        let permissions: import('../permissions/permissions.service').CachedPermission[] = [];
        if (user.rol_id) {
            permissions = await this.permissionsService.getPermissionsForRole(user.rol_id);
        }

        return {
            ...user, // IDs básicos
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