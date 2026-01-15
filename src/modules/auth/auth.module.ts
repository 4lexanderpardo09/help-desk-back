import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';
import jwtConfig from '../../config/jwt.config';

@Module({
    imports: [
        ConfigModule.forFeature(jwtConfig),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        UsersModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const expiresInSeconds = 24 * 60 * 60; // 24 horas en segundos
                return {
                    secret: configService.get<string>('jwt.secret') || 'default-secret',
                    signOptions: {
                        expiresIn: expiresInSeconds,
                    },
                };
            },
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    exports: [AuthService, JwtModule],
})
export class AuthModule { }
