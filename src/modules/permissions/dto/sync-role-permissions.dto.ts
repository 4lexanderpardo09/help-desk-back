import { IsArray, IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para sincronizar permisos de un rol
 */
export class SyncRolePermissionsDto {
    @ApiProperty({ description: 'IDs de permisos a asignar', example: [1, 2, 3], type: [Number] })
    @IsNotEmpty({ message: 'La lista de permisos es requerida' })
    @IsArray()
    @IsInt({ each: true })
    permisoIds: number[];
}
