import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './interfaces/jwt-payload.interface';

/**
 * Estrategia de autenticación JWT para Passport.
 * * Esta clase se encarga de extraer el token JWT de la cabecera 'Authorization',
 * verificar su validez (firma y expiración) y transformar el payload en un objeto de usuario.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    
    /**
     * Configura la estrategia con la clave secreta y las reglas de extracción.
     * @param configService Servicio para acceder a las variables de entorno.
     * @throws Error si la variable `jwt.secret` no está definida.
     */
    constructor(configService: ConfigService) {
        const secret = configService.get<string>('jwt.secret');
        
        if (!secret) {
            throw new Error('JWT_SECRET is not defined');
        }

        super({
            // Extrae el token del Header como: Bearer <token>
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            // Rechaza el token si ha expirado
            ignoreExpiration: false,
            // Clave secreta para verificar la autenticidad del token
            secretOrKey: secret,
        });
    }

    /**
     * Valida el payload del token una vez que Passport ha confirmado que la firma es correcta.
     * * El valor retornado aquí se inyectará automáticamente en el objeto `Request` de Express
     * (accesible mediante `req.user` en los controladores protegidos).
     * * @param payload Contenido decodificado del JWT.
     * @returns Un objeto con la información esencial del usuario.
     */
    validate(payload: JwtPayload): JwtPayload {
        return {
            usu_id: payload.usu_id,
            usu_correo: payload.usu_correo,
            rol_id: payload.rol_id,
            reg_id: payload.reg_id,
            car_id: payload.car_id,
            dp_id: payload.dp_id,
            es_nacional: payload.es_nacional
        };
    }
}