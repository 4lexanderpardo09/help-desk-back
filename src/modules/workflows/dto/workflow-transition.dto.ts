import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

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

    @ApiProperty({ required: false, description: 'Firma en Base64 o ID de archivo' })
    @IsOptional()
    @IsString()
    signature?: string;
}

export class NextStepCandidateDto {
    @ApiProperty()
    stepId: number;

    @ApiProperty()
    stepName: string;

    @ApiProperty({ required: false })
    isFinal?: boolean;
}
