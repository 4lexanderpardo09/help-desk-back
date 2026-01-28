import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { UpdateTicketDto } from '../dto/update-ticket.dto';
import { User } from '../../users/entities/user.entity';

import { WorkflowEngineService } from '../../workflows/services/workflow-engine.service';
import { TemplatesService } from '../../templates/services/templates.service';
import { PdfStampingService, TextStampConfig } from '../../templates/services/pdf-stamping.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { DocumentsService } from '../../documents/services/documents.service';
import { TicketCampoValor } from '../entities/ticket-campo-valor.entity';
import { TicketAsignado } from '../entities/ticket-asignado.entity';
import { TicketParalelo } from '../entities/ticket-paralelo.entity';
import * as path from 'path';
import * as fs from 'fs/promises';

// Define where templates are stored (should match configured static assets or storage)
const TEMPLATE_DIR = path.resolve(process.cwd(), 'public', 'document', 'formato');
const OUTPUT_DIR = path.resolve(process.cwd(), 'public', 'document');

@Injectable()
export class TicketService {
    private readonly logger = new Logger(TicketService.name);

    constructor(
        @InjectRepository(Ticket)
        private readonly ticketRepo: Repository<Ticket>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        private readonly workflowEngine: WorkflowEngineService,
        private readonly templatesService: TemplatesService,
        private readonly pdfStampingService: PdfStampingService,
        private readonly notificationsService: NotificationsService,
        private readonly documentsService: DocumentsService,
        @InjectRepository(TicketCampoValor)
        private readonly ticketCampoValorRepo: Repository<TicketCampoValor>,
        @InjectRepository(TicketAsignado)
        private readonly ticketAsignadoRepo: Repository<TicketAsignado>,
        @InjectRepository(TicketParalelo)
        private readonly ticketParaleloRepo: Repository<TicketParalelo>,
    ) { }

    /**
     * Crea un nuevo ticket en el sistema.
     * Orquesta la asignación de empresa, departamento y regional basados en el creador,
     * inicia el flujo de trabajo correspondiente y genera el PDF inicial si aplica.
     * 
     * @param dto Datos iniciales del ticket
     * @returns Ticket creado con flujo iniciado y relaciones (pasoActual)
     */
    async create(dto: CreateTicketDto): Promise<Ticket> {
        // 1. Get User Info to fill default fields (empresa, departamento, regional)
        const user = await this.userRepo.findOne({
            where: { id: dto.usuarioId },
            relations: ['departamento', 'regional', 'empresas', 'cargo']
        });

        if (!user) throw new NotFoundException(`Usuario ${dto.usuarioId} no encontrado`);

        // 2. Prepare Entity (Initial State)
        const ticket = this.ticketRepo.create({
            ...dto,
            empresaId: dto.empresaId || user.empresas?.[0]?.id || 1, // Prioritize DTO, then User default, then 1
            departamentoId: user.departamentoId || 0,
            regionalId: user.regionalId || 0,
            fechaCreacion: new Date(),
            estado: 1, // Abierto
            usuarioAsignadoIds: dto.usuarioAsignadoId ? [dto.usuarioAsignadoId] : [] // Preserve manual assignment if present, though workflow might override
        });

        // 3. Save Ticket (to generate ID)
        const savedTicket = await this.ticketRepo.save(ticket);

        // 4. Start Workflow (Resolves Initial Step + Assignee + History)
        // This will update the ticket with the correct PasoFlujo and Assignee based on rules
        const ticketWithWorkflow = await this.workflowEngine.startTicketFlow(savedTicket, dto.usuarioAsignadoId);

        // 5. Save Dynamic Fields (if any)
        if (dto.templateValues && dto.templateValues.length > 0) {
            const valuesToSave = dto.templateValues.map(tv => this.ticketCampoValorRepo.create({
                ticketId: savedTicket.id,
                campoId: tv.campoId,
                valor: tv.valor,
                estado: 1
            }));
            await this.ticketCampoValorRepo.save(valuesToSave);
        }

        // 6. Generate Initial PDF (if applicable)
        await this.generateInitialPdf(ticketWithWorkflow, user, dto.templateValues);

        // 7. Notify Creator
        await this.notificationsService.notifyCreation(ticketWithWorkflow, user);

        return ticketWithWorkflow;
    }

    /**
     * Generates an initial PDF if the ticket's flow has a configured template.
     */
    private async generateInitialPdf(ticket: Ticket, creator: User, templateValues?: { campoId: number; valor: string; }[]): Promise<void> {
        try {
            if (!ticket.pasoActual || !ticket.pasoActual.flujoId) return;

            // Find valid template for this flow and company
            const template = await this.templatesService.getTemplateForFlow(
                ticket.pasoActual.flujoId,
                ticket.empresaId
            );

            if (!template) {
                this.logger.log(`No PDF template found for Flow ${ticket.pasoActual.flujoId} and Company ${ticket.empresaId}`);
                return;
            }

            // Get fields configured for the INITIAL step (if any) to stamp basic info
            // For now, we simulate stamping basic "Header" info if fields are configured
            const fields = await this.templatesService.getPdfFieldsForStep(ticket.pasoActualId!);

            if (fields.length === 0) {
                this.logger.log(`No PDF fields configured for Step ${ticket.pasoActualId}. Skipping generation.`);
                return;
            }

            // Map fields to values (Legacy logic mapped field codes to values)
            // Here we implement a basic mapper for standard fields
            const textsToStamp: TextStampConfig[] = fields.map(field => {
                let value = '';

                // 1. Check if we have a dynamic value for this field
                const dynamicVal = templateValues?.find(tv => tv.campoId === field.id);

                if (dynamicVal) {
                    value = dynamicVal.valor;
                } else {
                    // 2. Fallback to System Field mapping
                    switch (field.codigo.toUpperCase()) {
                        case 'TICKET_ID': value = ticket.id.toString(); break;
                        case 'FECHA_CREACION': value = ticket.fechaCreacion!.toISOString().split('T')[0]; break;
                        case 'TITULO': value = ticket.titulo || ''; break;
                        case 'SOLICITANTE': value = `${creator.nombre} ${creator.apellido || ''}`; break;
                        case 'CARGO': value = creator.cargo?.nombre || ''; break;
                        // Add more mappings as needed
                        default: value = ''; // For now, empty if not a system field
                    }
                }

                return {
                    text: value,
                    x: Number(field.coordX),
                    y: Number(field.coordY),
                    page: field.pagina,
                    size: field.fontSize
                };
            }).filter(t => t.text !== ''); // Only stamp if we have a value

            if (textsToStamp.length > 0) {
                const inputPath = path.join(TEMPLATE_DIR, template.nombrePlantilla);
                const outputPath = path.join(OUTPUT_DIR, `ticket_${ticket.id}.pdf`);

                await this.pdfStampingService.stampPdf(inputPath, textsToStamp, outputPath);

                // Read the generated file
                try {
                    const fileBuffer = await fs.readFile(outputPath);
                    await this.documentsService.saveTicketFile(ticket.id, fileBuffer, `ticket_${ticket.id}.pdf`);
                    this.logger.log(`Registered PDF for Ticket ${ticket.id}`);

                    // Clean up temp file in default output dir
                    await fs.unlink(outputPath);
                } catch (err) {
                    this.logger.error(`Error registering PDF for Ticket ${ticket.id}`, err);
                }
            }

        } catch (error) {
            this.logger.error(`Failed to generate initial PDF for ticket ${ticket.id}`, error.stack);
            // Do not block ticket creation
        }
    }

    /**
     * Actualiza un ticket existente.
     * @param id ID del ticket
     * @param dto Datos a actualizar
     * @returns Ticket actualizado
     */
    async update(id: number, dto: UpdateTicketDto): Promise<Ticket> {
        const ticket = await this.ticketRepo.findOne({ where: { id } });
        if (!ticket) throw new NotFoundException(`Ticket ${id} no encontrado`);

        this.ticketRepo.merge(ticket, dto);
        return this.ticketRepo.save(ticket);
    }

    /**
     * Busca un ticket por ID con sus relaciones principales.
     * @param id ID del ticket
     * @returns Ticket con relaciones
     */
    async findOne(id: number): Promise<Ticket> {
        const ticket = await this.ticketRepo.findOne({
            where: { id },
            relations: ['usuario', 'categoria', 'subcategoria', 'prioridad', 'pasoActual']
        });
        if (!ticket) throw new NotFoundException(`Ticket ${id} no encontrado`);
        return ticket;
    }

    /**
     * Helper to migrate legacy comma-separated assignments to the new many-to-many table.
     * Can be triggered via a temporary endpoint.
     */
    async migrateLegacyAssignments(): Promise<{ processed: number; created: number }> {
        this.logger.log('Starting migration of legacy assignments...');

        let processed = 0;
        let created = 0;

        // 1. Migrate Legacy Comma-Separated Column (Principal)
        const tickets = await this.ticketRepo.createQueryBuilder('t')
            .where('t.usu_asig IS NOT NULL')
            .andWhere('t.usu_asig != ""')
            .getMany();

        for (const ticket of tickets) {
            processed++;
            const legacyIds = ticket.usuarioAsignadoIds || [];

            if (legacyIds.length === 0) continue;

            for (const uid of legacyIds) {
                const exists = await this.ticketAsignadoRepo.findOne({
                    where: { ticketId: ticket.id, usuarioId: uid }
                });

                if (!exists) {
                    const assignment = this.ticketAsignadoRepo.create({
                        ticketId: ticket.id,
                        usuarioId: uid,
                        tipo: 'Principal',
                        // Use ticket creation date if assignment date unavailable
                        fechaAsignacion: ticket.fechaCreacion || new Date()
                    });
                    await this.ticketAsignadoRepo.save(assignment);
                    created++;
                }
            }
        }

        // 2. Migrate Parallel Assignments (From tm_ticket_paralelo)
        // These might NOT be in usu_asig if they were created before the sync logic came in.
        this.logger.log('Scanning for legacy parallel assignments...');
        const parallels = await this.ticketParaleloRepo.find({
            where: { estado: 'Pendiente', activo: 1 }
        });

        for (const p of parallels) {
            processed++;
            if (!p.ticketId || !p.usuarioId) continue;

            const exists = await this.ticketAsignadoRepo.findOne({
                where: { ticketId: p.ticketId, usuarioId: p.usuarioId }
            });

            if (!exists) {
                // Try to get ticket date for better accuracy, otherwise now
                const assignment = this.ticketAsignadoRepo.create({
                    ticketId: p.ticketId,
                    usuarioId: p.usuarioId,
                    tipo: 'Paralelo',
                    fechaAsignacion: p.fechaCreacion || new Date()
                });
                await this.ticketAsignadoRepo.save(assignment);
                created++;
            }
        }

        this.logger.log(`Migration finished. Scanned (Items): ${processed}, Created: ${created}`);
        return { processed, created };
    }

    /**
     * Get all parallel tasks for a specific ticket
     */
    async getParallelTasks(ticketId: number) {
        const tasks = await this.ticketParaleloRepo.find({
            where: { ticketId, activo: 1 },
            relations: ['usuario'],
            order: { fechaCreacion: 'ASC' }
        });

        return tasks.map(task => ({
            id: task.id,
            ticketId: task.ticketId,
            pasoId: task.pasoId,
            usuarioId: task.usuarioId,
            estado: task.estado,
            estadoTiempoPaso: task.estadoTiempoPaso,
            fechaCreacion: task.fechaCreacion,
            fechaCierre: task.fechaCierre,
            comentario: task.comentario,
            usuario: task.usuario ? {
                id: task.usuario.id,
                nombre: task.usuario.nombre,
                email: task.usuario.email
            } : undefined
        }));
    }
}
