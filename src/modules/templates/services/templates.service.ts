import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CampoPlantilla } from '../entities/campo-plantilla.entity';
import { FlujoPlantilla } from '../../workflows/entities/flujo-plantilla.entity';

@Injectable()
export class TemplatesService {
    private readonly logger = new Logger(TemplatesService.name);

    constructor(
        @InjectRepository(CampoPlantilla)
        private readonly campoRepo: Repository<CampoPlantilla>,
        @InjectRepository(FlujoPlantilla)
        private readonly plantillaRepo: Repository<FlujoPlantilla>,
    ) { }

    /**
     * Obtiene la configuración de campos (coordenadas X, Y) para un paso específico del flujo.
     * Filtra automáticamente aquellos campos que tienen coordenadas válidas (> 0) para ser estampados.
     *
     * @param pasoId ID del paso actual (`PasoFlujo`).
     * @returns Lista de `CampoPlantilla` con coordenadas configuradas.
     */
    async getPdfFieldsForStep(pasoId: number): Promise<CampoPlantilla[]> {
        return this.campoRepo
            .createQueryBuilder('c')
            .where('c.pasoId = :pasoId', { pasoId })
            .andWhere('c.estado = 1')
            .andWhere('(c.coordX > 0 OR c.coordY > 0)') // Only fields meant for PDF stamping
            .getMany();
    }

    /**
     * Busca el archivo de plantilla PDF base asociado a un Flujo y una Empresa.
     * Si existen múltiples versiones activas, retorna la última (por ID descendente).
     *
     * @param flujoId ID del flujo en ejecución.
     * @param companyId ID de la empresa del usuario.
     * @returns Entidad `FlujoPlantilla` con el nombre del archivo, o `null` si no existe.
     */
    async getTemplateForFlow(flujoId: number, companyId: number): Promise<FlujoPlantilla | null> {
        return this.plantillaRepo.findOne({
            where: {
                flujoId,
                empresaId: companyId,
                estado: 1,
            },
            order: { id: 'DESC' }, // Get latest if multiple active
        });
    }
}
