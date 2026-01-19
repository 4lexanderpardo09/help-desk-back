import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt, MaxLength } from 'class-validator';

/**
 * DTO para crear una subcategoría
 */
export class CreateSubcategoriaDto {
    @ApiProperty({ description: 'Nombre de la subcategoría', example: 'Software' })
    @IsNotEmpty({ message: 'El nombre es requerido' })
    @IsString()
    @MaxLength(255)
    nombre: string;

    @ApiPropertyOptional({ description: 'Descripción de la subcategoría' })
    @IsOptional()
    @IsString()
    descripcion?: string;

    @ApiPropertyOptional({ description: 'ID de la categoría padre' })
    @IsOptional()
    @IsInt()
    categoriaId?: number;

    @ApiPropertyOptional({ description: 'ID de la prioridad por defecto' })
    @IsOptional()
    @IsInt()
    prioridadId?: number;

    @ApiPropertyOptional({ description: 'Estado (1=Activo, 0=Inactivo)', default: 1 })
    @IsOptional()
    @IsInt()
    estado?: number;
}
