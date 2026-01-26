import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateFlujoDto {
    @ApiProperty()
    @IsString()
    @MaxLength(200)
    nombre: string;

    @ApiProperty()
    @IsInt()
    subcategoriaId: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    nombreAdjunto?: string;
}
