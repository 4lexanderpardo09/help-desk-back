import { IsNotEmpty, IsString, IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para crear una Prioridad
 */
export class CreatePriorityDto {
    @ApiProperty({ description: 'Nombre de la prioridad', example: 'Alta' })
    @IsNotEmpty({ message: 'El nombre es requerido' })
    @IsString()
    nombre: string;

    @ApiProperty({ description: 'Estado', default: 1, required: false })
    @IsOptional()
    @IsInt()
    @Min(0)
    estado?: number;
}
