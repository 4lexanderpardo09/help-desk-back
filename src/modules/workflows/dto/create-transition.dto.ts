import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTransitionDto {
    @ApiProperty({ description: 'ID del paso origen' })
    @IsInt()
    @IsNotEmpty()
    pasoOrigenId: number;

    @ApiPropertyOptional({ description: 'ID del paso destino (si aplica)' })
    @IsInt()
    @IsOptional()
    pasoDestinoId?: number;

    @ApiPropertyOptional({ description: 'ID de la ruta (si aplica)' })
    @IsInt()
    @IsOptional()
    rutaId?: number;

    @ApiPropertyOptional({ description: 'Clave de condición (ej: "aprobado", "rechazado")', maxLength: 50 })
    @IsString()
    @IsOptional()
    @MaxLength(50)
    condicionClave?: string;

    @ApiProperty({ description: 'Nombre descriptivo de la condición/transición', maxLength: 150 })
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    condicionNombre: string;

    @ApiPropertyOptional({ description: 'Estado (1=Activo, 0=Inactivo)', default: 1 })
    @IsInt()
    @IsOptional()
    estado?: number;
}
