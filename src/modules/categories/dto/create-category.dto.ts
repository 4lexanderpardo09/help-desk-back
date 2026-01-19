import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt, IsIn } from 'class-validator';

export class CreateCategoryDto {
    @ApiProperty({ example: 'Hardware', description: 'Nombre de la categoría' })
    @IsNotEmpty()
    @IsString()
    nombre: string;

    @ApiProperty({ example: 1, description: 'Estado: 1=Activo, 0=Inactivo', default: 1 })
    @IsOptional()
    @IsIn([0, 1])
    @IsInt()
    estado?: number;
}
