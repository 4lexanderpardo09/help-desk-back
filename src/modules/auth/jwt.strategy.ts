import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
        const secret = configService.get<string>('jwt.secret');
        if (!secret) {
            throw new Error('JWT_SECRET is not defined');
        }

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secret,
        });
    }

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
