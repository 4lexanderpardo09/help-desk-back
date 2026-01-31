import { Body, Controller, Get, Post, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { 
    ApiBearerAuth, 
    ApiOperation, 
    ApiResponse, 
    ApiTags, 
    ApiBadRequestResponse, 
    ApiUnauthorizedResponse, 
    ApiNotFoundResponse 
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { JwtAuthGuard } from './jwt.guard';
import { User } from './decorators/user.decorator';
import type { JwtPayload } from './interfaces/jwt-payload.interface';

/**
 * Controlador de Autenticación.
 * Gestiona el inicio de sesión y la recuperación de información del usuario actual.
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    /**
     * Inicia sesión en el sistema.
     * Valida las credenciales (Email/Password) y retorna un token de acceso.
     * * @param loginDto DTO con email y contraseña.
     */
    @Post('login')
    @HttpCode(HttpStatus.OK) // Es buena práctica devolver 200 en login, aunque 201 también es válido.
    @ApiOperation({ summary: 'Iniciar sesión', description: 'Autentica al usuario y retorna un token JWT de acceso.' })
    @ApiResponse({ status: 200, description: 'Login exitoso. Retorna el Access Token.', type: AuthResponseDto })
    @ApiUnauthorizedResponse({ description: 'Credenciales inválidas (usuario no existe o contraseña incorrecta).' })
    @ApiBadRequestResponse({ description: 'Datos de entrada inválidos (ej. email con formato incorrecto).' })
    async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
        return this.authService.login(loginDto.email, loginDto.password);
    }

    /**
     * Obtiene el perfil completo del usuario autenticado.
     * Utiliza el token JWT para identificar al usuario y recuperar sus datos extendidos y permisos.
     * * @param user Payload del usuario extraído del token (inyectado por @User).
     */
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('profile')
    @ApiOperation({ summary: 'Obtener perfil actual', description: 'Retorna el perfil detallado del usuario, incluyendo roles, permisos y ubicación organizacional.' })
    @ApiResponse({ status: 200, description: 'Perfil recuperado correctamente.', type: ProfileResponseDto })
    @ApiUnauthorizedResponse({ description: 'Token no proporcionado, inválido o expirado.' })
    @ApiNotFoundResponse({ description: 'El usuario del token ya no existe en la base de datos (ej. fue eliminado recientemente).' })
    async getProfile(@User() user: JwtPayload): Promise<ProfileResponseDto> {
        return this.authService.getFullProfile(user);
    }
}