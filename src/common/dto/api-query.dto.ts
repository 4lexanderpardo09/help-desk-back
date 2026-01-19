
import { IsOptional, IsInt, IsString, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class ApiQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    limit?: number;

    @IsOptional()
    @IsString()
    included?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    page?: number;

    @IsOptional()
    @IsObject()
    // Permitir cualquier propiedad dentro de filter ya que es un filtro dinámico
    filter?: Record<string, any>;
}
