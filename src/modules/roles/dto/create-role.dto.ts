import { IsNotEmpty, IsString, MaxLength, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para crear un Rol
 */
export class CreateRoleDto {
    @ApiProperty({ description: 'Nombre del rol', example: 'Administrador' })
    @IsNotEmpty({ message: 'El nombre es requerido' })
    @IsString()
    @MaxLength(50)
    nombre: string;

    @ApiProperty({ description: 'Descripción del rol', example: 'Acceso total al sistema', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    descripcion?: string;

    @ApiProperty({ description: 'Estado', default: 1, required: false })
    @IsOptional()
    @IsInt()
    @Min(0)
    estado?: number;
}
