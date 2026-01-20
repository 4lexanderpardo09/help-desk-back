import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampoPlantilla } from './entities/campo-plantilla.entity';
import { TemplatesService } from './services/templates.service';
import { PdfStampingService } from './services/pdf-stamping.service';
import { FlujoPlantilla } from '../workflows/entities/flujo-plantilla.entity';

@Module({
    imports: [TypeOrmModule.forFeature([CampoPlantilla, FlujoPlantilla])],
    providers: [TemplatesService, PdfStampingService],
    exports: [TemplatesService, PdfStampingService],
})
export class TemplatesModule { }
