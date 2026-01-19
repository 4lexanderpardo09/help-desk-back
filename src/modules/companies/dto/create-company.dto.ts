import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para crear una Empresa
 * 
 * Las asociaciones con usuarios y categorías se manejan desde esas entidades:
 * - Usuario: empresasIds[] en CreateUserDto
 * - Categoría: empresaIds[] en CreateCategoryDto
 */
export class CreateCompanyDto {
    @ApiProperty({ description: 'Nombre de la empresa', example: 'Electrocréditos' })
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
