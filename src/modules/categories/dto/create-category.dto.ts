import { IsInt, IsString, MaxLength, IsOptional, IsArray, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
    @ApiProperty({ example: 'Hardware', description: 'Nombre de la categoría' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    nombre: string;

    @ApiProperty({ example: 1, description: 'Estado (1: Activo, 0: Inactivo)', required: false, default: 1 })
    @IsInt()
    @IsOptional()
    estado?: number;

    @ApiProperty({ example: [1, 2], description: 'IDs de departamentos asociados', required: false, type: [Number] })
    @IsArray()
    @IsInt({ each: true })
    @IsOptional()
    departamentoIds?: number[];

    @ApiProperty({ example: [1, 3], description: 'IDs de empresas asociadas', required: false, type: [Number] })
    @IsArray()
    @IsInt({ each: true })
    @IsOptional()
    empresaIds?: number[];
}
