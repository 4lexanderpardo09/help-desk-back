import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
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
}
