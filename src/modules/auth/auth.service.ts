import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
    constructor(private readonly jwtService: JwtService) { }

    /**
     * Valida credenciales y genera token JWT
     * TODO: Implementar validación real contra la DB legacy
     */
    async login(
        email: string,
        password: string,
    ): Promise<{ accessToken: string }> {
        // TODO: Reemplazar con consulta real a la tabla de usuarios
        const user = await this.validateUser(email, password);

        if (!user) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        return {
            accessToken: this.jwtService.sign(payload),
        };
    }

    /**
     * Valida usuario contra la base de datos
     * TODO: Conectar con UserModel cuando exista
     */
    private async validateUser(
        email: string,
        password: string,
    ): Promise<{ id: number; email: string; role: string } | null> {
        // Placeholder - será reemplazado con consulta real
        // Por ahora retorna un usuario de prueba
        if (email === 'admin@test.com' && password === 'test123') {
            return { id: 1, email: 'admin@test.com', role: 'admin' };
        }
        return null;
    }

    /**
     * Verifica si un token es válido
     */
    verifyToken(token: string): JwtPayload {
        return this.jwtService.verify<JwtPayload>(token);
    }
}
