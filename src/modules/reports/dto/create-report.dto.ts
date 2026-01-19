import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt, IsOptional } from 'class-validator';

export class CreateReportDto {
    @ApiProperty({ description: 'Nombre del reporte' })
    @IsNotEmpty({ message: 'El nombre es requerido' })
    @IsString()
    nombre: string;

    @ApiProperty({ description: 'Consulta SQL del reporte' })
    @IsNotEmpty({ message: 'El SQL es requerido' })
    @IsString()
    sql: string;

    @ApiPropertyOptional({ description: 'Estado del reporte (1=Activo, 0=Inactivo)', default: 1 })
    @IsOptional()
    @IsInt()
    estado?: number;
}
