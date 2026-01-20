import { ApiProperty } from '@nestjs/swagger';

export enum TimelineItemType {
    COMMENT = 'comment',
    ASSIGNMENT = 'assignment',
    STATUS_CHANGE = 'status_change',
    ERROR_REPORT = 'error_report'
}

export class TimelineActorDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    nombre: string;

    @ApiProperty({ required: false })
    avatar?: string;
}

export class TimelineDocumentDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    nombre: string;

    @ApiProperty()
    url: string;
}

export class TicketTimelineItemDto {
    @ApiProperty({ enum: TimelineItemType })
    type: TimelineItemType;

    @ApiProperty()
    fecha: Date;

    @ApiProperty({ type: TimelineActorDto })
    actor: TimelineActorDto;

    @ApiProperty({ description: 'Descripción, comentario o detalle del evento' })
    descripcion: string;

    @ApiProperty({ required: false, description: 'Estado anterior (si aplica)' })
    estadoAnterior?: string;

    @ApiProperty({ required: false, description: 'Estado nuevo (si aplica)' })
    estadoNuevo?: string;

    @ApiProperty({ required: false, type: [TimelineDocumentDto] })
    documentos?: TimelineDocumentDto[];

    @ApiProperty({ required: false, description: 'Si el evento es una asignacion, a quien se asigno' })
    asignadoA?: TimelineActorDto;
}
