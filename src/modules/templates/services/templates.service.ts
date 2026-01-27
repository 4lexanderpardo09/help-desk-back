import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CampoPlantilla } from '../entities/campo-plantilla.entity';
import { FlujoPlantilla } from '../../workflows/entities/flujo-plantilla.entity';
import { PasoFlujo } from '../../workflows/entities/paso-flujo.entity';
import { Consulta } from '../../reports/entities/consulta.entity';
import { TicketCampoValor } from '../../tickets/entities/ticket-campo-valor.entity';
import { ApiQueryHelper, PaginatedResult } from '../../../common/utils/api-query-helper';

@Injectable()
export class TemplatesService {
    private readonly logger = new Logger(TemplatesService.name);

    constructor(
        @InjectRepository(CampoPlantilla)
        private readonly campoRepo: Repository<CampoPlantilla>,
        @InjectRepository(FlujoPlantilla)
        private readonly plantillaRepo: Repository<FlujoPlantilla>,
        @InjectRepository(PasoFlujo)
        private readonly pasoRepo: Repository<PasoFlujo>,
        @InjectRepository(Consulta)
        private readonly consultaRepo: Repository<Consulta>,
        @InjectRepository(TicketCampoValor)
        private readonly valorRepo: Repository<TicketCampoValor>,
        private readonly dataSource: DataSource,
    ) { }

    /**
     * Obtiene TODOS los campos configurados para un paso.
     */
    async getFieldsByStep(pasoId: number): Promise<CampoPlantilla[]> {
        return this.campoRepo.find({
            where: { pasoId, estado: 1 },
            order: { id: 'ASC' }
        });
    }

    async findAll(options?: {
        limit?: number;
        page?: number;
        filter?: Record<string, any>;
        sort?: string;
    }): Promise<PaginatedResult<FlujoPlantilla>> {
        const qb = this.plantillaRepo.createQueryBuilder('plantilla')
            .leftJoinAndSelect('plantilla.flujo', 'flujo')
            .leftJoinAndSelect('plantilla.empresa', 'empresa');

        qb.where('plantilla.estado = :estado', { estado: 1 });

        const allowedFilters = ['nombrePlantilla', 'flujo.id', 'empresa.id'];
        ApiQueryHelper.applyFilters(qb, options?.filter, allowedFilters, 'plantilla');

        ApiQueryHelper.applySort(qb, options?.sort, 'plantilla');

        return ApiQueryHelper.paginate(qb, { limit: options?.limit, page: options?.page });
    }



    /**
     * Obtiene los campos para estampado PDF (con coordenadas).
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
     * Ejecuta la query dinámica asociada a un campo para autocomplete.
     */
    async executeFieldQuery(campoId: number, term = ''): Promise<any[]> {
        const campo = await this.campoRepo.findOne({ where: { id: campoId } });
        if (!campo || !campo.campoQuery) return [];

        let sql = '';
        const params: any[] = [];

        // 1. PRESETS
        if (campo.campoQuery.startsWith('PRESET_')) {
            switch (campo.campoQuery) {
                case 'PRESET_REGIONAL':
                    sql = 'SELECT reg_id as id, reg_nom as label FROM tm_regional WHERE est=1 AND reg_nom LIKE ?';
                    params.push(`%${term}%`);
                    break;
                case 'PRESET_CARGO':
                    sql = 'SELECT car_id as id, car_nom as label FROM tm_cargo WHERE est=1 AND car_nom LIKE ?';
                    params.push(`%${term}%`);
                    break;
                case 'PRESET_USUARIOS':
                    sql = `SELECT usu_id as id, CONCAT(usu_nom, ' ', usu_ape) as label FROM tm_usuario WHERE est=1 AND (usu_nom LIKE ? OR usu_ape LIKE ?)`;
                    params.push(`%${term}%`, `%${term}%`);
                    break;
                default:
                    this.logger.warn(`Preset desconocido: ${campo.campoQuery}`);
                    return [];
            }
        }
        // 2. ID de Consulta (tm_consulta)
        else if (!isNaN(Number(campo.campoQuery))) {
            const consultaId = Number(campo.campoQuery);
            const consulta = await this.consultaRepo.findOne({ where: { id: consultaId } });

            if (!consulta || !consulta.sql) return [];

            // Basic safety: Ensure SQL doesn't contain forbidden keywords if user input is somehow injected? 
            // Better: We wrap it as a subquery or append WHERE. 
            // Legacy likely just expected the SQL to be a SELECT.

            // We assume the stored SQL is a SELECT list. We append a filter if 'term' is present.
            // CAUTION: This assumes the SQL structure allows appending logic.
            // If the SQL is complex, this might fail. 
            // For now, we replicate simple behavior: Run query, filter in memory if SQL handling is too risky?
            // Or assume SQL is "SELECT id, name FROM table".

            sql = consulta.sql;

            // If term provided, try to filter safely? 
            // Legacy analysis: "Else -> Ejecuta SQL raw".
            // Implementation: We won't inject 'term' directly. We'll run the query and filter in memory? 
            // Memory filter is safer but slower. 
            // Or, replace a placeholder '%SEARCH%' if it exists in the configured SQL.
            if (term && sql.includes('%SEARCH%')) {
                sql = sql.replace('%SEARCH%', term);
            } else if (term) {
                // Fallback: Append WHERE if valid? Too risky. 
                // Safety choice: Return all (limited) and let frontend filter, OR use simple string match in memory.
                // Let's execute and slice.
            }
        }
        else {
            // 3. Raw SQL directly in string (Legacy fallback - Dangerous but existing)
            // We only allow this if it starts with SELECT
            if (!campo.campoQuery.trim().toUpperCase().startsWith('SELECT')) {
                return [];
            }
            sql = campo.campoQuery;
        }

        if (!sql) return [];

        try {
            // Execute raw SQL
            // CAUTION: params only used for Presets currently.
            // For stored SQL, we execute as is.
            const results = await this.dataSource.query(sql, params);

            // If term was provided and not handled via SQL params (like in Presets), filter result in memory
            // This handles the "Numeric ID" case safely without modifying stored SQL
            if (term && !campo.campoQuery.startsWith('PRESET_')) {
                const lowerTerm = term.toLowerCase();
                // Limit results to 20 to avoid payload bloat
                return results
                    .filter((r: any) =>
                        (r.label && String(r.label).toLowerCase().includes(lowerTerm)) ||
                        (r.nombre && String(r.nombre).toLowerCase().includes(lowerTerm)) ||
                        Object.values(r).some(v => String(v).toLowerCase().includes(lowerTerm))
                    )
                    .slice(0, 50);
            }

            return results.slice(0, 50);

        } catch (error) {
            this.logger.error(`Error executing dynamic query for field ${campoId}: ${error.message}`);
            return [];
        }
    }

    /**
     * Busca el archivo de plantilla PDF base asociado a un Flujo y una Empresa.
     * Si existen múltiples versiones activas, retorna la última (por ID descendente).
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

    async getValuesByTicket(ticketId: number): Promise<any[]> {
        const values = await this.valorRepo.find({
            where: { ticketId, estado: 1 },
            relations: ['campo']
        });

        // Enrich with resolved names for Presets
        const enrichedValues = await Promise.all(values.map(async (v) => {
            let displayValue = v.valor;
            const campo = v.campo;

            if (v.valor && campo && campo.campoQuery && campo.campoQuery.startsWith('PRESET_')) {
                try {
                    let sql = '';
                    if (campo.campoQuery === 'PRESET_REGIONAL') {
                        sql = 'SELECT reg_nom as label FROM tm_regional WHERE reg_id = ?';
                    } else if (campo.campoQuery === 'PRESET_CARGO') {
                        sql = 'SELECT car_nom as label FROM tm_cargo WHERE car_id = ?';
                    } else if (campo.campoQuery === 'PRESET_USUARIOS') {
                        sql = "SELECT CONCAT(usu_nom, ' ', usu_ape) as label FROM tm_usuario WHERE usu_id = ?";
                    }

                    if (sql) {
                        const res = await this.dataSource.query(sql, [v.valor]);
                        if (res && res.length > 0) {
                            displayValue = res[0].label;
                        }
                    }
                } catch (e) {
                    this.logger.warn(`Error resolving value for field ${campo.id}: ${e.message}`);
                }
            }

            // ELAPSED DAYS LOGIC
            // If the field is configured to show elapsed days and it's a DATE type
            let elapsedStr = null;
            if (campo.mostrarDiasTranscurridos && (campo.tipo === 'date' || campo.tipo === 'datetime') && v.valor) {
                const dateVal = new Date(v.valor);
                if (!isNaN(dateVal.getTime())) {
                    const now = new Date();
                    const diffTime = Math.abs(now.getTime() - dateVal.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    // Or formatting logic "2 weeks, 3 days". Keeping it simple "X days".
                    elapsedStr = `${diffDays} días`;
                }
            }

            return {
                ...v,
                resolvedValue: displayValue,
                elapsed: elapsedStr
            };
        }));

        return enrichedValues;
    }

    /**
     * Crea una nueva plantilla de flujo para una empresa.
     * Guarda el archivo en el sistema de archivos y crea el registro en BD.
     */
    async createTemplate(flujoId: number, empresaId: number, file: Express.Multer.File): Promise<FlujoPlantilla> {
        // 1. Validate Flow existence (Optional but good)
        // 2. Save File
        // Using standard path convention: public/document/formato/{filename}
        const fs = require('fs/promises');
        const path = require('path');
        const UPLOAD_DIR = path.resolve(process.cwd(), 'public', 'document', 'formato');

        // Ensure directory exists
        try {
            await fs.access(UPLOAD_DIR);
        } catch {
            await fs.mkdir(UPLOAD_DIR, { recursive: true });
        }

        // Generate filename: flow_{id}_emp_{id}_{timestamp}.pdf to avoid collisions
        const filename = `flow_${flujoId}_emp_${empresaId}_${Date.now()}.pdf`;
        const filePath = path.join(UPLOAD_DIR, filename);

        await fs.writeFile(filePath, file.buffer);

        // 3. Create Entity
        const template = this.plantillaRepo.create({
            flujoId,
            empresaId,
            nombrePlantilla: filename, // Storing just filename as per legacy convention in DocumentsService
            estado: 1
        });

        return this.plantillaRepo.save(template);
    }

    /**
     * Elimina soft-delete una plantilla.
     * Opcional: Eliminar archivo físico (por ahora solo soft-delete en BD).
     */
    async removeTemplate(id: number): Promise<void> {
        await this.plantillaRepo.update(id, { estado: 0 });
    }
}
