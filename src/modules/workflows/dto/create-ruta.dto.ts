import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRutaDto {
    @ApiProperty({ description: 'ID del flujo al que pertenece la ruta' })
    @IsInt()
    @IsNotEmpty()
    flujoId!: number;

    @ApiProperty({ description: 'Nombre descriptivo de la ruta', maxLength: 150 })
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    nombre!: string;

    @ApiPropertyOptional({ description: 'Estado (1=Activo, 0=Inactivo)', default: 1 })
    @IsInt()
    @IsOptional()
    estado?: number;
}
