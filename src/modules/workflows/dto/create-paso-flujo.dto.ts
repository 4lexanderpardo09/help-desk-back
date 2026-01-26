import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePasoFlujoDto {
    @ApiProperty()
    @IsInt()
    flujoId: number;

    @ApiProperty()
    @IsInt()
    orden: number;

    @ApiProperty()
    @IsString()
    @MaxLength(255)
    nombre: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsInt()
    cargoAsignadoId?: number;

    @ApiProperty({ required: false, description: 'Tiempo SLA en horas' })
    @IsOptional()
    @IsInt()
    tiempoHabil?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    descripcion?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsInt()
    requiereSeleccionManual?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    esTareaNacional?: boolean;

    @ApiProperty()
    @IsBoolean()
    esAprobacion: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    nombreAdjunto?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsInt()
    campoReferenciaJefeId?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsInt()
    permiteCerrar?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    necesitaAprobacionJefe?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    esParalelo?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    requiereFirma?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsInt()
    requiereCamposPlantilla?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    asignarCreador?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    cerrarTicketObligatorio?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    permiteDespachoMasivo?: boolean;
}
