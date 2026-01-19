import { IsNotEmpty, IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para crear una Regional
 */
export class CreateRegionalDto {
    @ApiProperty({ description: 'Nombre de la regional', example: 'Regional Norte' })
    @IsNotEmpty({ message: 'El nombre es requerido' })
    @IsString()
    nombre: string;

    @ApiProperty({ description: 'ID de la zona', required: false })
    @IsOptional()
    @IsInt()
    zonaId?: number;

    @ApiProperty({ description: 'Estado', default: 1, required: false })
    @IsOptional()
    @IsInt()
    @Min(0)
    estado?: number;
}
