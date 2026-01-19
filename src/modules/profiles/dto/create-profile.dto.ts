import { IsNotEmpty, IsString, IsInt, IsOptional } from 'class-validator';

export class CreateProfileDto {
    @IsString()
    @IsNotEmpty()
    nombre: string;

    @IsInt()
    @IsOptional()
    estado?: number;
}
