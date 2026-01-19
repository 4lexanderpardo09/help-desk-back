import { IsNotEmpty, IsString, IsInt, IsOptional } from 'class-validator';

export class CreatePositionDto {
    @IsString()
    @IsNotEmpty()
    nombre: string;

    @IsInt()
    @IsOptional()
    estado?: number;
}
