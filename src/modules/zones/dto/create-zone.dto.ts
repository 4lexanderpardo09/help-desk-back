import { IsNotEmpty, IsString, MaxLength, IsOptional, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateZoneDto {
    @ApiProperty({ description: 'Nombre de la zona', example: 'Zona Norte' })
    @IsNotEmpty()
    @IsString()
    @MaxLength(150)
    nombre: string;

    @ApiProperty({ description: 'Estado de la zona (1=Activo, 0=Inactivo)', example: 1, required: false })
    @IsOptional()
    @IsInt()
    estado?: number;
}
