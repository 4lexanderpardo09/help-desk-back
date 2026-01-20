import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class TicketFilterDto {
    @ApiPropertyOptional({ description: 'Término de búsqueda (título, ID, descripción)' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'Estado del ticket (Abierto, Cerrado)' })
    @IsOptional()
    @IsString()
    status?: string;

    @ApiPropertyOptional({ description: 'Fecha de creación inicial (YYYY-MM-DD)' })
    @IsOptional()
    @IsDateString()
    dateFrom?: string;

    @ApiPropertyOptional({ description: 'Fecha de creación final (YYYY-MM-DD)' })
    @IsOptional()
    @IsDateString()
    dateTo?: string;

    @ApiPropertyOptional({ description: 'ID del Ticket' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    ticketId?: number;

    @ApiPropertyOptional({ description: 'ID de Categoría' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    categoryId?: number;

    @ApiPropertyOptional({ description: 'ID de Subcategoría' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    subcategoryId?: number;

    @ApiPropertyOptional({ description: 'ID de Etiqueta' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    tagId?: number;

    @ApiPropertyOptional({ description: 'ID de Empresa' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    companyId?: number;

    @ApiPropertyOptional({ description: 'Página actual (Paginación)', default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Registros por página (Paginación)', default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10;
}
