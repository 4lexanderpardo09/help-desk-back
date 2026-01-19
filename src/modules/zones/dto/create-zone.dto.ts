import { IsNotEmpty, IsString, MaxLength, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para crear una Zona
 */
export class CreateZoneDto {
    @ApiProperty({ description: 'Nombre de la zona', example: 'Zona Norte' })
    @IsNotEmpty({ message: 'El nombre es requerido' })
    @IsString()
    @MaxLength(150)
    nombre: string;

    @ApiProperty({ description: 'Estado', default: 1, required: false })
    @IsOptional()
    @IsInt()
    @Min(0)
    estado?: number;
}
