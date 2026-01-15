import {
    IsString,
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsInt,
    IsBoolean,
    MinLength,
} from 'class-validator';

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    nombre: string;

    @IsString()
    @IsNotEmpty()
    apellido: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsInt()
    rolId: number;

    @IsInt()
    @IsOptional()
    departamentoId?: number | null;

    @IsBoolean()
    esNacional: boolean;

    @IsInt()
    @IsOptional()
    regionalId?: number | null;

    @IsInt()
    @IsOptional()
    cargoId?: number | null;

    @IsString()
    @IsOptional()
    cedula?: string | null;
}
