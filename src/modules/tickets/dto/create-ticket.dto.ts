import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsArray } from 'class-validator';

export class CreateTicketDto {
    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    usuarioId: number;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    categoriaId: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    subcategoriaId?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    prioridadId?: number;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    titulo: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    descripcion: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsArray()
    archivos?: any[]; // Handled by Multer, mostly logic param
}
