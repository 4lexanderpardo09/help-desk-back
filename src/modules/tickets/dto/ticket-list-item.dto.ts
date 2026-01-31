import { ApiProperty } from '@nestjs/swagger';

export class TicketTagDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    nombre: string;

    @ApiProperty()
    color: string;
}

export class TicketListItemDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    titulo: string;

    @ApiProperty()
    estado: string;

    @ApiProperty()
    fechaCreacion: Date;

    @ApiProperty()
    categoria: string;

    @ApiProperty()
    subcategoria: string;

    @ApiProperty()
    prioridadUsuario: string;

    @ApiProperty()
    prioridadDefecto: string;

    @ApiProperty()
    creadorNombre: string;

    @ApiProperty({ description: 'Nombre del agente asignado', required: false })
    asignadoNombre?: string;

    @ApiProperty({ type: [TicketTagDto], description: 'Etiquetas asociadas' })
    etiquetas: TicketTagDto[];

    @ApiProperty({ description: 'Si el paso esta atrasado o a tiempo', required: false })
    estadoTiempo?: string;
}

export class TicketListResponseDto {
    @ApiProperty({ type: [TicketListItemDto] })
    data: TicketListItemDto[];

    @ApiProperty()
    total: number;

    @ApiProperty()
    page: number;

    @ApiProperty()
    limit: number;
}
