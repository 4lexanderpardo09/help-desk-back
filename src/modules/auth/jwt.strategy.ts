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
            sub: payload.sub,
            email: payload.email,
            role: payload.role,
        };
    }
}
