import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCompanyDto {
    @ApiProperty({ example: 'Electrocréditos', description: 'Nombre de la empresa' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    nombre: string;

    @ApiProperty({ example: 1, description: 'Estado (1: Activo, 0: Inactivo)', required: false, default: 1 })
    @IsInt()
    @IsOptional()
    estado?: number;

    @ApiProperty({ example: [1, 2], description: 'IDs de usuarios asociados', required: false, type: [Number] })
    @IsArray()
    @IsInt({ each: true })
    @IsOptional()
    usuariosIds?: number[];

    @ApiProperty({ example: [1, 3], description: 'IDs de categorías asociadas', required: false, type: [Number] })
    @IsArray()
    @IsInt({ each: true })
    @IsOptional()
    categoriasIds?: number[];
}
