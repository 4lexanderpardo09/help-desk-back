import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataExcel } from '../entities/data-excel.entity';

@Injectable()
export class ExcelDataService {
    constructor(
        @InjectRepository(DataExcel)
        private readonly repo: Repository<DataExcel>,
    ) { }

    /**
     * Obtiene el dataset Excel asignado a un flujo.
     * Retorna el último cargado si hay varios.
     * 
     * @param flujoId ID del Flujo
     */
    async getDataForFlow(flujoId: number): Promise<any[]> {
        const record = await this.repo.findOne({
            where: { flujoId, estado: 1 },
            order: { id: 'DESC' }
        });

        if (!record || !record.datosJson) return [];

        try {
            return JSON.parse(record.datosJson);
        } catch (error) {
            console.error(`Error parsing Excel JSON for flow ${flujoId}`, error);
            return [];
        }
    }
}
