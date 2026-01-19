import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCompanyDto {
    @ApiProperty({ description: 'Nombre de la empresa', maxLength: 100 })
    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    nombre: string;

    @ApiProperty({ description: 'Estado de la empresa (1=Activo, 0=Inactivo)', default: 1, required: false })
    @IsOptional()
    @IsInt()
    estado?: number;
}
