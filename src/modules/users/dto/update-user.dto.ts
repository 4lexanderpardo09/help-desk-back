import {
    IsString,
    IsEmail,
    IsOptional,
    IsInt,
    IsBoolean,
    MinLength,
    IsArray,
} from 'class-validator';

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    nombre?: string;

    @IsString()
    @IsOptional()
    apellido?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @MinLength(6)
    @IsOptional()
    password?: string;

    @IsInt()
    @IsOptional()
    rolId?: number;

    @IsInt()
    @IsOptional()
    departamentoId?: number | null;

    @IsBoolean()
    @IsOptional()
    esNacional?: boolean;

    @IsInt()
    @IsOptional()
    regionalId?: number | null;

    @IsInt()
    @IsOptional()
    cargoId?: number | null;

    @IsString()
    @IsString()
    @IsOptional()
    cedula?: string | null;

    @IsInt({ each: true })
    @IsArray()
    @IsOptional()
    empresasIds?: number[];
}
