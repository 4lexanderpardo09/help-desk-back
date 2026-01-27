import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class TransitionTicketDto {
    @ApiProperty({ description: 'ID del ticket a transicionar' })
    @IsInt()
    ticketId: number;

    @ApiProperty({ description: 'Clave de la transición (ej: "aprobar", "rechazar" o stepId directo)' })
    @IsString()
    transitionKeyOrStepId: string;

    @ApiProperty({ required: false, description: 'Comentario opcional para el historial' })
    @IsOptional()
    @IsString()
    comentario?: string;

    @ApiProperty({ required: false, description: 'ID del usuario que realiza la acción' })
    @IsOptional()
    @IsInt()
    actorId?: number;

    @ApiProperty({ required: false, description: 'ID del usuario objetivo (selección manual)' })
    @IsOptional()
    @IsInt()
    targetUserId?: number;

    @ApiProperty({ required: false, description: 'Firma en Base64 o ID de archivo' })
    @IsOptional()
    @IsString()
    signature?: string;

    @ApiProperty({ required: false, isArray: true, description: 'Valores de campos dinámicos de la plantilla' })
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => TemplateValueDto)
    templateValues?: TemplateValueDto[];

    @ApiProperty({
        required: false,
        description: 'Map of RoleId -> UserId for parallel assignments',
        additionalProperties: { type: 'number' }
        // Removed type: 'object', as it is inferred or strictly checked. 
        // If specific type needed, could use type: Object
    })
    @IsOptional()
    manualAssignments?: Record<string, number>;
}

export class TemplateValueDto {
    @ApiProperty({ description: 'ID del campo de la plantilla (tm_campo_plantilla)' })
    @IsInt()
    campoId: number;

    @ApiProperty({ description: 'Valor ingresado por el usuario' })
    @IsString()
    valor: string;
}

export class NextStepCandidateDto {
    @ApiProperty()
    stepId: number;

    @ApiProperty()
    stepName: string;

    @ApiProperty({ required: false })
    isFinal?: boolean;
}
