import { ApiProperty } from '@nestjs/swagger';

export class ProfileResponseDto {
    @ApiProperty({ description: 'ID del usuario', example: 1 })
    usu_id: number;

    @ApiProperty({ description: 'Correo electrónico', example: 'usuario@example.com' })
    usu_correo: string;

    @ApiProperty({ description: 'ID del rol (puede ser null)', example: 1, nullable: true })
    rol_id: number | null;

    @ApiProperty({ description: 'ID de la regional (puede ser null)', example: 2, nullable: true })
    reg_id: number | null;

    @ApiProperty({ description: 'ID del cargo (puede ser null)', example: 5, nullable: true })
    car_id: number | null;

    @ApiProperty({ description: 'ID del departamento (puede ser null)', example: 3, nullable: true })
    dp_id: number | null;

    @ApiProperty({ description: 'Indica si es usuario nacional', example: false })
    es_nacional: boolean;
}
