import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRutaPasoDto {
    @ApiProperty({ description: 'ID de la ruta padre' })
    @IsInt()
    @IsNotEmpty()
    rutaId!: number;

    @ApiProperty({ description: 'ID del paso a vincular' })
    @IsInt()
    @IsNotEmpty()
    pasoId!: number;

    @ApiProperty({ description: 'Orden en la secuencia' })
    @IsInt()
    @IsNotEmpty()
    orden!: number;

    @ApiPropertyOptional({ description: 'Estado (1=Activo, 0=Inactivo)', default: 1 })
    @IsInt()
    @IsOptional()
    estado?: number;
}
