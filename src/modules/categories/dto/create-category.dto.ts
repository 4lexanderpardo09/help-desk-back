import { IsInt, IsString, MaxLength, IsOptional, IsArray, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para crear una Categoría
 */
export class CreateCategoryDto {
    @ApiProperty({ description: 'Nombre de la categoría', example: 'Hardware' })
    @IsNotEmpty({ message: 'El nombre es requerido' })
    @IsString()
    @MaxLength(150)
    nombre: string;

    @ApiProperty({ description: 'Estado', default: 1, required: false })
    @IsOptional()
    @IsInt()
    @Min(0)
    estado?: number;

    @ApiProperty({ description: 'IDs de departamentos asociados', required: false, type: [Number] })
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    departamentoIds?: number[];

    @ApiProperty({ description: 'IDs de empresas asociadas', required: false, type: [Number] })
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    empresaIds?: number[];
}
