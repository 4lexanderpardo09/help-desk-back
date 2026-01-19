import { IsNotEmpty, IsString, IsInt, IsOptional } from 'class-validator';

export class CreatePriorityDto {
    @IsString()
    @IsNotEmpty()
    nombre: string;

    @IsInt()
    @IsOptional()
    estado?: number;
}
