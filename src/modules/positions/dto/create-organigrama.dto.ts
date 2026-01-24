import { IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrganigramaDto {
    @ApiProperty({ description: 'ID del cargo subordinado', example: 1 })
    @IsInt()
    @IsNotEmpty()
    cargoId: number;

    @ApiProperty({ description: 'ID del cargo jefe (superior)', example: 2 })
    @IsInt()
    @IsNotEmpty()
    jefeCargoId: number;

    @ApiProperty({ description: 'Estado del registro (1=Activo, 0=Inactivo)', default: 1 })
    @IsInt()
    estado?: number;
}
