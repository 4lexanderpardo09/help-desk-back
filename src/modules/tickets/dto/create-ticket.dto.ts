import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsArray } from 'class-validator';

export class CreateTicketDto {
    @ApiProperty({ required: false, description: 'ID del usuario (extraído del token JWT)' })
    @IsOptional()
    @IsNumber()
    usuarioId?: number;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    categoriaId: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    empresaId?: number;

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

    @ApiProperty({ required: false })
    @IsOptional()
    @IsArray()
    templateValues?: { campoId: number; valor: string; }[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    usuarioAsignadoId?: number;
}
