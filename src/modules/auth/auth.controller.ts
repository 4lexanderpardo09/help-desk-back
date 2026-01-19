import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { JwtAuthGuard } from './jwt.guard';
import { User } from './decorators/user.decorator';
import type { JwtPayload } from './interfaces/jwt-payload.interface';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @ApiOperation({ summary: 'Iniciar sesión', description: 'Autentica usuario y retorna token JWT.' })
    @ApiResponse({ status: 201, description: 'Login exitoso.', type: AuthResponseDto })
    @ApiResponse({ status: 401, description: 'Credenciales inválidas.' })
    async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
        return this.authService.login(loginDto.email, loginDto.password);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('profile')
    @ApiOperation({ summary: 'Perfil de usuario', description: 'Obtiene el perfil del usuario autenticado (desde el token).' })
    @ApiResponse({ status: 200, description: 'Perfil del usuario.', type: ProfileResponseDto })
    @ApiResponse({ status: 401, description: 'No autorizado.' })
    getProfile(@User() user: JwtPayload): ProfileResponseDto {
        return user;
    }
}

