import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDepartmentDto {
    @ApiProperty({ example: 'Soporte Técnico', description: 'Nombre del departamento' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    nombre: string;

    @ApiProperty({ example: 1, description: 'Estado del departamento (1: Activo, 0: Inactivo)', required: false, default: 1 })
    @IsInt()
    @IsOptional()
    estado?: number;

    @ApiProperty({ example: [1, 2], description: 'IDs de categorías asociadas', required: false, type: [Number] })
    @IsArray()
    @IsInt({ each: true })
    @IsOptional()
    categoriaIds?: number[];
}
