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

    @ApiProperty({ description: 'Nombre del usuario', example: 'Juan', required: false })
    nombre?: string;

    @ApiProperty({ description: 'Apellido del usuario', example: 'Perez', required: false })
    apellido?: string;

    @ApiProperty({ description: 'Permisos del usuario', example: [{ action: 'read', subject: 'User' }], required: false })
    permissions?: any[]; // Usamos any[] para evitar dependencia circular con Permission entity aqui, o definimos un DTO simple
    @ApiProperty({ description: 'Datos del rol', required: false })
    role?: any;

    @ApiProperty({ description: 'Datos del cargo', required: false })
    cargo?: any;

    @ApiProperty({ description: 'Datos de la regional', required: false })
    regional?: any;

    @ApiProperty({ description: 'Datos del departamento', required: false })
    departamento?: any;
}
