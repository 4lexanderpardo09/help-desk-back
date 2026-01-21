import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampoPlantilla } from './entities/campo-plantilla.entity';
import { TemplatesService } from './services/templates.service';
import { PdfStampingService } from './services/pdf-stamping.service';
import { FlujoPlantilla } from '../workflows/entities/flujo-plantilla.entity';
import { Consulta } from '../reports/entities/consulta.entity';
import { TicketCampoValor } from '../tickets/entities/ticket-campo-valor.entity';
import { TemplatesController } from './templates.controller';

@Module({
    imports: [TypeOrmModule.forFeature([
        CampoPlantilla,
        FlujoPlantilla,
        Consulta,
        TicketCampoValor
    ])],
    controllers: [TemplatesController],
    providers: [TemplatesService, PdfStampingService],
    exports: [TemplatesService, PdfStampingService],
})
export class TemplatesModule { }
