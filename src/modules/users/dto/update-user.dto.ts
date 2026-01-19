import {
    IsString,
    IsEmail,
    IsOptional,
    IsInt,
    IsBoolean,
    MinLength,
    IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para actualizar un Usuario (todos los campos opcionales)
 */
export class UpdateUserDto {
    @ApiProperty({ description: 'Nombre del usuario', required: false })
    @IsOptional()
    @IsString()
    nombre?: string;

    @ApiProperty({ description: 'Apellido del usuario', required: false })
    @IsOptional()
    @IsString()
    apellido?: string;

    @ApiProperty({ description: 'Correo electrónico', required: false })
    @IsOptional()
    @IsEmail({}, { message: 'Formato de email inválido' })
    email?: string;

    @ApiProperty({ description: 'Contraseña (mínimo 6 caracteres)', required: false })
    @IsOptional()
    @IsString()
    @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
    password?: string;

    @ApiProperty({ description: 'ID del rol asignado', required: false })
    @IsOptional()
    @IsInt()
    rolId?: number;

    @ApiProperty({ description: 'ID del departamento', required: false })
    @IsOptional()
    @IsInt()
    departamentoId?: number | null;

    @ApiProperty({ description: 'Define si el usuario es de ámbito nacional', required: false })
    @IsOptional()
    @IsBoolean()
    esNacional?: boolean;

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

    @ApiProperty({ description: 'IDs de perfiles asignados', required: false, type: [Number] })
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    perfilIds?: number[];
}

