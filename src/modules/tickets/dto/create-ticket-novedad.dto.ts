import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTicketNovedadDto {
    @ApiProperty({ description: 'ID del usuario a quien se asigna la novedad' })
    @IsInt()
    @IsNotEmpty()
    usuarioAsignadoId: number;

    @ApiProperty({ description: 'Descripción o motivo de la novedad' })
    @IsString()
    @IsNotEmpty()
    descripcion: string;
}
