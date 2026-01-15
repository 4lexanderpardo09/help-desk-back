import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt.guard';
import { User } from './decorators/user.decorator';
import type { JwtPayload } from './interfaces/jwt-payload.interface';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    async login(@Body() loginDto: LoginDto): Promise<{ accessToken: string }> {
        return this.authService.login(loginDto.email, loginDto.password);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@User() user: JwtPayload) {
        return user;
    }
}
