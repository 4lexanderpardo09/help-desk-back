import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsInt, IsArray } from 'class-validator';

/**
 * DTO para crear una regla de mapeo
 */
export class CreateReglaMapeoDto {
    @ApiProperty({ description: 'ID de la subcategoría' })
    @IsNotEmpty({ message: 'La subcategoría es requerida' })
    @IsInt()
    subcategoriaId: number;

    @ApiPropertyOptional({ description: 'IDs de cargos creadores', type: [Number] })
    @IsOptional()
    @IsArray()
    creadorCargoIds?: number[];

    @ApiPropertyOptional({ description: 'IDs de perfiles creadores', type: [Number] })
    @IsOptional()
    @IsArray()
    creadorPerfilIds?: number[];

    @ApiPropertyOptional({ description: 'IDs de cargos asignados', type: [Number] })
    @IsOptional()
    @IsArray()
    asignadoCargoIds?: number[];

    @ApiPropertyOptional({ description: 'Estado (1=Activo, 0=Inactivo)', default: 1 })
    @IsOptional()
    @IsInt()
    estado?: number;
}
