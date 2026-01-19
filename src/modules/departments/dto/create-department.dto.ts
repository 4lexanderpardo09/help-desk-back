import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para crear un Departamento
 * 
 * Las asociaciones con categorías se manejan desde Category:
 * - Categoría: departamentoIds[] en CreateCategoryDto
 */
export class CreateDepartmentDto {
    @ApiProperty({ description: 'Nombre del departamento', example: 'Soporte Técnico' })
    @IsNotEmpty({ message: 'El nombre es requerido' })
    @IsString()
    @MaxLength(100)
    nombre: string;

    @ApiProperty({ description: 'Estado', default: 1, required: false })
    @IsOptional()
    @IsInt()
    @Min(0)
    estado?: number;
}
