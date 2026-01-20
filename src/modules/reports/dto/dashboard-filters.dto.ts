import { IsOptional, IsDateString, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class DashboardFiltersDto {
    @ApiProperty({ required: false, description: 'Fecha inicio (YYYY-MM-DD)' })
    @IsOptional()
    @IsDateString()
    dateFrom?: string;

    @ApiProperty({ required: false, description: 'Fecha fin (YYYY-MM-DD)' })
    @IsOptional()
    @IsDateString()
    dateTo?: string;

    @ApiProperty({ required: false, description: 'Agrupar por (departamento, categoria, usuario)' })
    @IsOptional()
    @IsString()
    groupBy?: 'department' | 'category' | 'user' | 'priority';

    @ApiProperty({ required: false, description: 'Filtrar por Departamento ID' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    departmentId?: number;

    @ApiProperty({ required: false, description: 'Filtrar por Categoría ID' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    categoryId?: number;
}
