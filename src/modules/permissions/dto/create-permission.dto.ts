import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, IsIn } from 'class-validator';

export class CreatePermissionDto {
    @ApiProperty({ description: 'Acción del permiso', example: 'create' })
    @IsString()
    @IsNotEmpty()
    @IsIn(['manage', 'create', 'read', 'update', 'delete'])
    action: string;

    @ApiProperty({ description: 'Recurso (Subject) sobre el que aplica', example: 'User' })
    @IsString()
    @IsNotEmpty()
    subject: string;

    @ApiProperty({ description: 'Descripción legible del permiso', example: 'Puede crear usuarios' })
    @IsString()
    @IsOptional()
    descripcion?: string;

    @ApiProperty({ description: 'Estado del permiso (1: Activo, 0: Inactivo)', example: 1, default: 1 })
    @IsInt()
    @IsOptional()
    estado?: number = 1;
}
