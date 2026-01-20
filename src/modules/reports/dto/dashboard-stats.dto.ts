import { ApiProperty } from '@nestjs/swagger';

export class DatasetItemDto {
    @ApiProperty({ description: 'Etiqueta del dato (ej: nombre del departamento)' })
    label: string;

    @ApiProperty({ description: 'Valor numérico' })
    value: number;

    @ApiProperty({ required: false, description: 'ID de referencia (opcional)' })
    id?: number;
}

export class DashboardStatsDto {
    @ApiProperty({ description: 'Total de tickets abiertos en el periodo' })
    openCount: number;

    @ApiProperty({ description: 'Total de tickets cerrados en el periodo' })
    closedCount: number;

    @ApiProperty({ description: 'Total de tickets en el periodo' })
    totalCount: number;

    @ApiProperty({ type: [DatasetItemDto], description: 'Datos agrupados para gráficos' })
    dataset: DatasetItemDto[];
}
