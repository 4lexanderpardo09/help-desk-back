import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { AbilityFactory } from './abilities/ability.factory';
import { UsersModule } from '../users/users.module';
import { PermissionsModule } from '../permissions/permissions.module';
import jwtConfig from '../../config/jwt.config';

/**
 * Módulo de Autenticación y Autorización.
 * * Se encarga de orquestar:
 * 1. La estrategia de Passport (JWT).
 * 2. La configuración asíncrona de tokens.
 * 3. La integración con el sistema de permisos y habilidades (CASL/AbilityFactory).
 */
@Module({
    imports: [
        // Carga la configuración específica de JWT desde el archivo de configuración
        ConfigModule.forFeature(jwtConfig),
        
        // Configura Passport para usar JWT como estrategia por defecto
        PassportModule.register({ defaultStrategy: 'jwt' }),
        
        // Importación de módulos dependientes
        UsersModule,
        
        // forwardRef necesario para resolver la dependencia circular entre Auth y Permissions
        forwardRef(() => PermissionsModule), 

        /**
         * Configuración asíncrona de JwtModule.
         * Permite inyectar ConfigService para obtener el secreto de forma segura.
         */
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                // Definición de tiempo de vida del token: 24 Horas
                const expiresInSeconds = 24 * 60 * 60; 
                
                return {
                    // Obtiene el secreto del archivo de configuración o usa uno por defecto (no recomendado en prod)
                    secret: configService.get<string>('jwt.secret') || 'default-secret',
                    signOptions: {
                        expiresIn: expiresInSeconds,
                    },
                };
            },
        }),
    ],
    controllers: [AuthController],
    providers: [
        AuthService, 
        JwtStrategy, 
        AbilityFactory // Fábrica para el control de acceso basado en habilidades (CASL)
    ],
    exports: [
        AuthService, 
        JwtModule, 
        AbilityFactory // Se exportan para que otros módulos puedan verificar tokens o permisos
    ],
})
export class AuthModule { }