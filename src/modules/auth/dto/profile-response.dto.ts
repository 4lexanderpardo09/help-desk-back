import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO que representa la respuesta completa del perfil de usuario.
 * * Incluye datos básicos, identificadores de relaciones (IDs) y 
 * los objetos anidados con detalles (Roles, Cargos, Permisos).
 */
export class ProfileResponseDto {
    
    /** Identificador único del usuario (Primary Key). */
    @ApiProperty({ description: 'ID único del usuario', example: 1 })
    usu_id: number;

    /** Correo corporativo. */
    @ApiProperty({ description: 'Correo electrónico', example: 'usuario@empresa.com' })
    usu_correo: string;

    /** ID del Rol asignado. */
    @ApiProperty({ description: 'ID del rol (puede ser null si no tiene)', example: 1, nullable: true })
    rol_id: number | null;

    /** ID de la Regional geográfica. */
    @ApiProperty({ description: 'ID de la regional asignada (puede ser null)', example: 2, nullable: true })
    reg_id: number | null;

    /** ID del Cargo laboral. */
    @ApiProperty({ description: 'ID del cargo ocupado (puede ser null)', example: 5, nullable: true })
    car_id: number | null;

    /** ID del Departamento administrativo. */
    @ApiProperty({ description: 'ID del departamento (puede ser null)', example: 3, nullable: true })
    dp_id: number | null;

    /** Bandera de alcance de datos. */
    @ApiProperty({ description: 'Indica si el usuario tiene permisos para ver datos a nivel nacional', example: false })
    es_nacional: boolean;

    /** Nombre de pila. */
    @ApiProperty({ description: 'Nombre del usuario', example: 'Juan', required: false })
    nombre?: string;

    /** Apellidos. */
    @ApiProperty({ description: 'Apellido del usuario', example: 'Pérez', required: false })
    apellido?: string;

    /** * Lista de permisos (acciones y sujetos).
     * * Idealmente se mapea desde CASL o la tabla de permisos.
     */
    @ApiProperty({ 
        description: 'Lista de permisos asignados al usuario', 
        example: [{ action: 'read', subject: 'User' }, { action: 'create', subject: 'Report' }], 
        required: false 
    })
    permissions?: any[]; 

    /** Objeto con el detalle del Rol (nombre, código, etc.). */
    @ApiProperty({ 
        description: 'Detalles del objeto Rol asociado', 
        example: { id: 1, nombre: 'Administrador', codigo: 'ADMIN' },
        required: false 
    })
    role?: any;

    /** Objeto con el detalle del Cargo. */
    @ApiProperty({ 
        description: 'Detalles del objeto Cargo', 
        example: { id: 5, nombre: 'Analista TI' },
        required: false 
    })
    cargo?: any;

    /** Objeto con el detalle de la Regional. */
    @ApiProperty({ 
        description: 'Detalles de la Regional', 
        example: { id: 2, nombre: 'Antioquia' },
        required: false 
    })
    regional?: any;

    /** Objeto con el detalle del Departamento. */
    @ApiProperty({ 
        description: 'Detalles del Departamento administrativo', 
        example: { id: 3, nombre: 'Sistemas' },
        required: false 
    })
    departamento?: any;
}