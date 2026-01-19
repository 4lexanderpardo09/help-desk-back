import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para inicio de sesión
 */
export class LoginDto {
    @ApiProperty({ description: 'Correo electrónico', example: 'usuario@example.com' })
    @IsNotEmpty({ message: 'El email es requerido' })
    @IsEmail({}, { message: 'Formato de email inválido' })
    email: string;

    @ApiProperty({ description: 'Contraseña', example: 'secret123' })
    @IsNotEmpty({ message: 'La contraseña es requerida' })
    @IsString()
    password: string;
}
