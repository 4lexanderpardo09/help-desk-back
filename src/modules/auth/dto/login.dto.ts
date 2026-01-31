import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para la transferencia de credenciales de inicio de sesión.
 * * Este objeto valida que los datos recibidos en el cuerpo de la petición (body)
 * cumplan con el formato esperado antes de llegar al AuthService.
 */
export class LoginDto {
    
    /** * Correo electrónico corporativo del usuario.
     * Debe cumplir con el formato estándar de email (ej. texto@dominio.com).
     */
    @ApiProperty({ 
        description: 'Correo electrónico registrado del usuario', 
        example: 'juan.perez@empresa.com',
        format: 'email' // Ayuda a Swagger UI a validar el input en la documentación
    })
    @IsNotEmpty({ message: 'El email es requerido' })
    @IsEmail({}, { message: 'El formato del email no es válido' })
    email: string;

    /** * Contraseña de acceso en texto plano.
     * Será verificada contra el hash (Bcrypt o MD5) almacenado en base de datos.
     */
    @ApiProperty({ 
        description: 'Contraseña de acceso', 
        example: 'Seguridad2025*',
        type: String
    })
    @IsNotEmpty({ message: 'La contraseña es requerida' })
    @IsString({ message: 'La contraseña debe ser una cadena de texto' })
    password: string;
}