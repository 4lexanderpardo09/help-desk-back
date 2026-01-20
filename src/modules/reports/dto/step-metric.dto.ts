import { ApiProperty } from '@nestjs/swagger';

export class StepMetricDto {
    @ApiProperty({ description: 'Nombre del paso o estado' })
    stepName: string;

    @ApiProperty({ description: 'Duración en minutos' })
    durationMinutes: number;

    @ApiProperty({ description: 'Fecha de inicio del paso' })
    startDate: Date;

    @ApiProperty({ description: 'Fecha de fin del paso (o null si es actual)' })
    endDate: Date | null;

    @ApiProperty({ description: 'Nombre del usuario asignado en este paso' })
    assignedUser: string;
}
