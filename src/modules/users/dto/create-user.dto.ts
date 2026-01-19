import {
    IsString,
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsInt,
    IsBoolean,
    MinLength,
    IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para crear un Usuario
 */
export class CreateUserDto {
    @ApiProperty({ description: 'Nombre del usuario', example: 'Juan' })
    @IsNotEmpty({ message: 'El nombre es requerido' })
    @IsString()
    nombre: string;

    @ApiProperty({ description: 'Apellido del usuario', example: 'Pérez' })
    @IsNotEmpty({ message: 'El apellido es requerido' })
    @IsString()
    apellido: string;

    @ApiProperty({ description: 'Correo electrónico', example: 'juan.perez@example.com' })
    @IsNotEmpty({ message: 'El email es requerido' })
    @IsEmail({}, { message: 'Formato de email inválido' })
    email: string;

    @ApiProperty({ description: 'Contraseña (mínimo 6 caracteres)', example: 'secreto123' })
    @IsString()
    @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
    password: string;

    @ApiProperty({ description: 'ID del rol asignado', example: 1 })
    @IsInt()
    rolId: number;

    @ApiProperty({ description: 'ID del departamento', required: false })
    @IsOptional()
    @IsInt()
    departamentoId?: number | null;

    @ApiProperty({ description: 'Define si el usuario es de ámbito nacional', example: false })
    @IsBoolean()
    esNacional: boolean;

    @ApiProperty({ description: 'ID de la regional', required: false })
    @IsOptional()
    @IsInt()
    regionalId?: number | null;

    @ApiProperty({ description: 'ID del cargo', required: false })
    @IsOptional()
    @IsInt()
    cargoId?: number | null;

    @ApiProperty({ description: 'Cédula del usuario', required: false })
    @IsOptional()
    @IsString()
    cedula?: string | null;

    @ApiProperty({ description: 'IDs de empresas asociadas', required: false, type: [Number] })
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    empresasIds?: number[];
}
