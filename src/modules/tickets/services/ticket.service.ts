import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { UpdateTicketDto } from '../dto/update-ticket.dto';
import { User } from '../../users/entities/user.entity';

import { WorkflowEngineService } from '../../workflows/services/workflow-engine.service';
import { TemplatesService } from '../../templates/services/templates.service';
import { PdfStampingService, TextStampConfig } from '../../templates/services/pdf-stamping.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { DocumentsService } from '../../documents/services/documents.service';
import { SlaService } from '../../workflows/services/sla.service';
import { TicketCampoValor } from '../entities/ticket-campo-valor.entity';
import { TicketAsignado } from '../entities/ticket-asignado.entity';
import { TicketParalelo } from '../entities/ticket-paralelo.entity';
import { TicketAsignacionHistorico } from '../entities/ticket-asignacion-historico.entity';
import { TicketNovedad } from '../entities/ticket-novedad.entity';
import { TicketError } from '../entities/ticket-error.entity';
import { TicketDetalle } from '../entities/ticket-detalle.entity';
import { TicketEtiqueta } from '../entities/ticket-etiqueta.entity';
import { CreateTicketNovedadDto } from '../dto/create-ticket-novedad.dto';
import { CloseTicketDto } from '../dto/close-ticket.dto'; // Imported
import { ErrorType, ErrorTypeCategory } from '../../error-types/entities/error-type.entity';
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
        @InjectRepository(TicketAsignacionHistorico)
        private readonly ticketAsigRepo: Repository<TicketAsignacionHistorico>,
        @InjectRepository(TicketNovedad)
        private readonly ticketNovedadRepo: Repository<TicketNovedad>,
        @InjectRepository(TicketError)
        private readonly ticketErrorRepo: Repository<TicketError>,
        @InjectRepository(TicketDetalle)
        private readonly ticketDetalleRepo: Repository<TicketDetalle>,
        @InjectRepository(ErrorType)
        private readonly errorTypeRepo: Repository<ErrorType>,
        @InjectRepository(TicketEtiqueta)
        private readonly ticketEtiquetaRepo: Repository<TicketEtiqueta>,
        private readonly slaService: SlaService,
    ) { }

    /**
     * Registers an error event for a ticket.
     * Creates a history record with the error code, preserving current state.
     */
    async registerErrorEvent(ticketId: number, userId: number, dto: any): Promise<void> {
        const ticket = await this.ticketRepo.findOne({
            where: { id: ticketId },
            relations: ['pasoActual']
        });

        if (!ticket) throw new NotFoundException(`Ticket ${ticketId} not found`);

        const errorType = await this.errorTypeRepo.findOne({ where: { id: dto.errorTypeId } });
        if (!errorType) throw new NotFoundException(`Error Type ${dto.errorTypeId} not found`);

        const comment = dto.description
            ? `Evento Registrado (${errorType.title}): ${dto.description}`
            : `Evento de Error Registrado: ${errorType.title}`;

        // Find previous valid assignment to attribute the error
        const lastAssignments = await this.ticketAsigRepo.find({
            where: { ticketId: ticket.id },
            order: { id: 'DESC' },
            take: 2 // Current and Previous
        });

        const latestAssignment = lastAssignments[0]; // The active/latest assignment
        const previousAssignment = lastAssignments.length > 1 ? lastAssignments[1] : null;

        // Determine Target User for Return
        // 1. Previous Assignee (if exists)
        // 2. The person who assigned the current step (Assignador)
        // 3. The ticket creator (Ultimate fallback)
        let targetUserId = previousAssignment?.usuarioAsignadoId;
        if (!targetUserId && latestAssignment?.usuarioAsignadorId) targetUserId = latestAssignment.usuarioAsignadorId;
        if (!targetUserId) targetUserId = ticket.usuarioId;

        // Target Step: If we go back, we ideally go back to Previous Step, or default to initial step?
        // Target Step: If we go back, we ideally go back to Previous Step, or default to initial step?
        // Actually, if we return to creator (closed), step doesn't matter much.
        // If we return to previous assignee, we use their step.
        const targetStepId = previousAssignment?.pasoId || ticket.pasoActualId || 0;

        this.logger.debug(`[ProcessError Debug] Ticket ${ticket.id}`);
        this.logger.debug(`[ProcessError Debug] Latest Assignment: ${latestAssignment?.id} (User: ${latestAssignment?.usuarioAsignadoId}, Assigner: ${latestAssignment?.usuarioAsignadorId})`);
        this.logger.debug(`[ProcessError Debug] Previous Assignment: ${previousAssignment?.id} (User: ${previousAssignment?.usuarioAsignadoId})`);
        this.logger.debug(`[ProcessError Debug] Resolved Target User: ${targetUserId}`);
        this.logger.debug(`[ProcessError Debug] Resolved Target Step: ${targetStepId}`);

        // Calculate SLA for the user reporting the event (userId) if they have an active assignment
        // We assume the user reporting is working on the ticket, so we check THEIR assignment.
        const currentAssignment = await this.ticketAsigRepo.findOne({
            where: {
                ticketId: ticket.id,
                usuarioAsignadoId: userId,
                estado: 1 // Active assignment (history log)
            },
            order: { id: 'DESC' }
        });

        let slaStatus = 'A Tiempo';

        if (currentAssignment) {
            // Find the Step definition for SLA validation
            // Ideally we need the 'Paso' entity. For now assuming ticket.pasoActual has days/hours if loaded.
            // If ticket.pasoActual is loaded properly in findOne above (it is), we can use it.
            if (ticket.pasoActual && ticket.pasoActual.tiempoHabil) {
                const status = this.slaService.calculateSlaStatus(
                    currentAssignment.fechaAsignacion,
                    ticket.pasoActual.tiempoHabil
                );
                this.logger.debug(`[SLA Debug] Error Event - Ticket ${ticket.id}: Calculated Status '${status}' (Start: ${currentAssignment.fechaAsignacion}, Limit: ${ticket.pasoActual.tiempoHabil}h)`);
                slaStatus = status;
                currentAssignment.estadoTiempoPaso = slaStatus;

                // Legacy: Seal the assignment with the error code
                currentAssignment.errorCodeId = dto.errorTypeId;
                currentAssignment.errorDescripcion = dto.description || null;

                await this.ticketAsigRepo.save(currentAssignment);
                this.logger.debug(`[SLA Debug] Error Event - Ticket ${ticket.id}: Saved Assignment ${currentAssignment.id} with SLA ${slaStatus}`);
            } else {
                this.logger.debug(`[SLA Debug] Error Event - Ticket ${ticket.id}: No Time Limit configured or Step not loaded.`);
            }
        } else {
            this.logger.debug(`[SLA Debug] Error Event - Ticket ${ticket.id}: Active Assignment not found for User ${userId}`);
        }

        // 1. Create Detail (Legacy: insert_ticket_detalle)
        const detalle = this.ticketDetalleRepo.create({
            ticketId: ticket.id,
            usuarioId: userId,
            descripcion: comment, // Includes "Evento Registrado: ..."
            fechaCreacion: new Date(),
            estado: 1
        });
        await this.ticketDetalleRepo.save(detalle);

        // 2. Create the Ticket Error Record (Legacy Logic uses tm_ticket_error)
        const ticketError = this.ticketErrorRepo.create({
            ticketId: ticket.id,
            usuarioReportaId: userId,
            usuarioResponsableId: targetUserId,
            errorTypeId: dto.errorTypeId,
            descripcion: dto.description || null,
            esErrorProceso: errorType.category === ErrorTypeCategory.PROCESS_ERROR,
            fechaCreacion: new Date(),
            estado: 1
        });
        await this.ticketErrorRepo.save(ticketError);

        // NOTE: We do NOT create a TicketAsignacionHistorico for the event itself anymore,
        // mirroring legacy behavior where errors are stored in tm_ticket_error and 
        // th_ticket_asignacion is reserved for actual transfers (like Returns).

        // 2. Handle Workflow Move Logic
        // Only PROCESS_ERROR triggers a return/move.
        if (errorType.category === ErrorTypeCategory.PROCESS_ERROR) {

            if (targetUserId) {
                // Special Case: Process Error && Target User is Creator
                if (targetUserId === ticket.usuarioId) {
                    // Close Ticket
                    ticket.ticketEstado = 'Cerrado';
                    ticket.estado = 2; // Closed status code
                    ticket.fechaCierre = new Date();
                    ticket.errorProceso = 1; // Mark as Process Error
                    await this.ticketRepo.save(ticket);

                    // Add Closing History
                    const closeHistory = this.ticketAsigRepo.create({
                        ticketId: ticket.id,
                        usuarioAsignadorId: userId,
                        usuarioAsignadoId: targetUserId, // Assigned back to creator? or just closed.
                        pasoId: targetStepId,
                        fechaAsignacion: new Date(),
                        estado: 2, // Closed
                        comentario: 'Ticket cerrado por Error de Proceso (Devuelto al creador)'
                    });
                    await this.ticketAsigRepo.save(closeHistory);

                    this.logger.log(`Ticket ${ticketId} CLOSED due to Process Error by User ${userId}`);
                } else {
                    // Return to Previous User
                    ticket.usuarioAsignadoIds = [targetUserId];
                    ticket.pasoActualId = targetStepId;
                    await this.ticketRepo.save(ticket);

                    // Add Return History
                    const returnHistory = this.ticketAsigRepo.create({
                        ticketId: ticket.id,
                        usuarioAsignadorId: userId,
                        usuarioAsignadoId: targetUserId,
                        pasoId: targetStepId,
                        fechaAsignacion: new Date(),
                        estado: 1,
                        comentario: `Devuelto por ${errorType.title}: ${dto.description || ''}`
                    });
                    await this.ticketAsigRepo.save(returnHistory);

                    this.logger.log(`Ticket ${ticketId} RETURNED to User ${targetUserId} due to ${errorType.title}`);
                }
            } else {
                this.logger.warn(`Ticket ${ticketId}: Is Process Error but targetUserId 0 (System?). Logic fell through.`);
            }
        }

        this.logger.log(`Registered Error Event ${dto.errorTypeId} for Ticket ${ticketId}`);
    }

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
    async findOne(id: number, userId?: number): Promise<Ticket> {
        const qb = this.ticketRepo.createQueryBuilder('t')
            .leftJoinAndSelect('t.usuario', 'u')
            .leftJoinAndSelect('t.categoria', 'c')
            .leftJoinAndSelect('t.subcategoria', 'sc')
            .leftJoinAndSelect('t.prioridad', 'p')
            .leftJoinAndSelect('t.pasoActual', 'pa')
            .where('t.id = :id', { id });

        if (userId) {
            // Load ONLY tags owned by this user
            qb.leftJoinAndSelect('t.ticketEtiquetas', 'te', 'te.estado = 1')
                .leftJoinAndSelect('te.etiqueta', 'e', 'e.estado = 1 AND e.usuarioId = :userId', { userId });
        } else {
            // Fallback: load all? Or keep empty? Let's keep empty or load all if no user specified (admin context?)
            // But existing behavior was 'relations' which is all.
            qb.leftJoinAndSelect('t.ticketEtiquetas', 'te', 'te.estado = 1')
                .leftJoinAndSelect('te.etiqueta', 'e', 'e.estado = 1');
        }

        const ticket = await qb.getOne();
        if (!ticket) throw new NotFoundException(`Ticket ${id} no encontrado`);

        // Map etiquetas relation to be compatible with frontend expectations if needed
        // The entity has 'ticketEtiquetas' -> 'etiqueta'. 
        if (ticket.ticketEtiquetas) {
            (ticket as any).etiquetas = ticket.ticketEtiquetas
                .filter(te => te.etiqueta) // Filter out nulls if any join failed
                .map(te => ({
                    id: te.etiqueta.id,
                    nombre: te.etiqueta.nombre,
                    color: te.etiqueta.color
                }));
        }

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

    /**
     * Creates a "Novedad" (Novelty) for a ticket.
     * Pauses the ticket logic and assigns a side-task.
     */
    async createNovelty(ticketId: number, userId: number, dto: CreateTicketNovedadDto) {
        const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
        if (!ticket) throw new NotFoundException(`Ticket ${ticketId} not found`);

        // Check if there is already an open novelty?
        const existing = await this.ticketNovedadRepo.findOne({
            where: { ticketId, estado: 'Abierta' }
        });

        if (existing) {
            throw new BadRequestException(`El ticket ya tiene una novedad abierta. Debe resolverla antes de crear otra.`);
        }

        // 1. Create Novedad
        const novedad = this.ticketNovedadRepo.create({
            ticketId: ticketId,
            pasoPausadoId: ticket.pasoActualId || 0,
            usuarioAsignadoNovedadId: dto.usuarioAsignadoId,
            usuarioCreadorNovedadId: userId,
            descripcion: dto.descripcion,
            fechaInicio: new Date(),
            estado: 'Abierta'
        });
        await this.ticketNovedadRepo.save(novedad);

        // 2. Pause Ticket
        ticket.ticketEstado = 'Pausado';
        await this.ticketRepo.save(ticket);

        // Check SLA for the creator of the novelty
        let slaStatus = 'A Tiempo';
        if (ticket.pasoActualId && ticket.usuarioAsignadoIds?.includes(userId)) {
            // Find assignment
            const currentAssignment = await this.ticketAsigRepo.findOne({
                where: {
                    ticketId: ticketId,
                    usuarioAsignadoId: userId,
                    estado: 1
                },
                order: { id: 'DESC' }
            });

            if (currentAssignment && ticket.pasoActual && ticket.pasoActual.tiempoHabil) {
                const status = this.slaService.calculateSlaStatus(
                    currentAssignment.fechaAsignacion,
                    ticket.pasoActual.tiempoHabil
                );
                this.logger.debug(`[SLA Debug] Novelty - Ticket ${ticketId}: Calculated Status '${status}'`);
                slaStatus = status;
                currentAssignment.estadoTiempoPaso = slaStatus;
                await this.ticketAsigRepo.save(currentAssignment);
            } else {
                this.logger.debug(`[SLA Debug] Novelty - Ticket ${ticketId}: Skipped SLA (No assignment or no time limit)`);
            }
        }

        // 3. Add Detail (Legacy: insert_ticket_detalle)
        const detalle = this.ticketDetalleRepo.create({
            ticketId: ticketId,
            usuarioId: userId,
            descripcion: `Novedad Creada: ${dto.descripcion}`,
            fechaCreacion: new Date(),
            estado: 1
        });
        await this.ticketDetalleRepo.save(detalle);

        return novedad;
    }

    /**
     * Resolves an active novelty for a ticket.
     */
    async resolveNovelty(ticketId: number, userId: number) {
        // ... (lines 578-609)
        const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
        if (!ticket) throw new NotFoundException(`Ticket ${ticketId} not found`);

        const novelty = await this.ticketNovedadRepo.findOne({
            where: { ticketId, estado: 'Abierta' }
        });

        if (!novelty) throw new BadRequestException(`No hay novedades abiertas para este ticket.`);

        // 1. Close Novedad
        novelty.estado = 'Resuelta';
        novelty.fechaFin = new Date();
        await this.ticketNovedadRepo.save(novelty);

        // 2. Resume Ticket
        ticket.ticketEstado = 'Abierto';
        await this.ticketRepo.save(ticket);

        // 3. History
        const history = this.ticketAsigRepo.create({
            ticketId: ticketId,
            usuarioAsignadorId: userId,
            usuarioAsignadoId: ticket.usuarioAsignadoIds?.[0] || userId, // Back to main assignee?
            pasoId: ticket.pasoActualId,
            fechaAsignacion: new Date(),
            estado: 1,
            comentario: `Novedad Resuelta. Ticket reanudado.`
        });
        await this.ticketAsigRepo.save(history);

        return novelty;
    }

    /**
     * Cierra un ticket manualmente en el último paso.
     */
    async closeTicket(id: number, userId: number, dto: CloseTicketDto): Promise<Ticket> {
        const ticket = await this.ticketRepo.findOne({
            where: { id },
            relations: ['pasoActual']
        });

        if (!ticket) throw new NotFoundException(`Ticket ${id} no encontrado`);

        // Validar si ya está cerrado
        if (ticket.estado === 3) throw new BadRequestException('El ticket ya está cerrado');

        // 1. Cerrar asignación anterior y calcular SLA
        let closingSlaStatus = null;

        // Buscar la asignación activa de este usuario (o la última activa si es admin/otro)
        // Buscar la última asignación de este usuario
        const currentAssignment = await this.ticketAsigRepo.findOne({
            where: {
                ticketId: ticket.id,
                usuarioAsignadoId: userId
            },
            order: { fechaAsignacion: 'DESC' }
        });

        if (currentAssignment) {
            this.logger.log(`[CloseTicket] Asignación encontrada para usuario ${userId}: ID ${currentAssignment.id}, Fecha: ${currentAssignment.fechaAsignacion}`);

            // Calcular SLA si aplica (usando fecha actual como "fin" lógico)
            if (ticket.pasoActual && ticket.pasoActual.tiempoHabil) {
                const status = this.slaService.calculateSlaStatus(
                    currentAssignment.fechaAsignacion,
                    ticket.pasoActual.tiempoHabil
                );
                this.logger.log(`[CloseTicket] SLA calculado: ${status} (Tiempo Paso: ${ticket.pasoActual.tiempoHabil}h)`);
                currentAssignment.estadoTiempoPaso = status;
                closingSlaStatus = status; // Guardar para el registro de cierre
            } else {
                this.logger.log(`[CloseTicket] No se calcula SLA: Paso ${ticket.pasoActualId} no tiene tiempo habil configurado`);
            }
            // Solo guardamos el estado del SLA, no cerramos fechaFin porque no existe
            await this.ticketAsigRepo.save(currentAssignment);
        } else {
            this.logger.warn(`[CloseTicket] No se encontró asignación previa para usuario ${userId} en ticket ${ticket.id}`);
            // Fallback: Buscar cualquier asignación reciente para al menos intentar calcular SLA
            const anyAssignment = await this.ticketAsigRepo.findOne({
                where: { ticketId: ticket.id },
                order: { fechaAsignacion: 'DESC' }
            });
            if (anyAssignment) {
                // Aquí podríamos calcular SLA también si quisiéramos ser robustos, 
                // pero por ahora solo evitamos el error de fechaFin
            }
        }

        // 2. Actualizar estado Ticket
        ticket.estado = 3; // Cerrado
        ticket.ticketEstado = 'Cerrado';
        ticket.fechaCierre = new Date();

        await this.ticketRepo.save(ticket);

        // 3. Registrar en Historial de Cierre
        const history = this.ticketAsigRepo.create({
            ticketId: ticket.id,
            usuarioAsignadorId: userId,
            usuarioAsignadoId: userId, // Self-assigned close
            pasoId: ticket.pasoActualId || 0,
            fechaAsignacion: new Date(),
            estado: 2, // Closed status in history
            comentario: `Ticket Cerrado Manualmente: ${dto.comentario}`,
            estadoTiempoPaso: closingSlaStatus
        });
        await this.ticketAsigRepo.save(history);

        this.logger.log(`Ticket ${id} cerrado por usuario ${userId}`);
        return ticket;
    }

    /**
     * Associates a tag with a ticket.
     */
    async addTag(ticketId: number, tagId: number, userId: number): Promise<void> {
        const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
        if (!ticket) throw new NotFoundException(`Ticket ${ticketId} not found`);

        // Check if already assigned (active)
        const existing = await this.ticketEtiquetaRepo.findOne({
            where: {
                ticketId,
                etiquetaId: tagId,
                estado: 1
            }
        });

        if (existing) return; // Already exists, do nothing

        // Check if previously assigned but inactive (reactivate)
        const inactive = await this.ticketEtiquetaRepo.findOne({
            where: {
                ticketId,
                etiquetaId: tagId,
                estado: 0
            }
        });

        if (inactive) {
            inactive.estado = 1;
            inactive.usuarioId = userId; // Update who re-added it
            inactive.fechaCreacion = new Date();
            await this.ticketEtiquetaRepo.save(inactive);
            return;
        }

        // Create new
        const newTag = this.ticketEtiquetaRepo.create({
            ticketId,
            etiquetaId: tagId,
            usuarioId: userId,
            fechaCreacion: new Date(),
            estado: 1
        });

        await this.ticketEtiquetaRepo.save(newTag);
    }

    /**
     * Removes a tag from a ticket (soft delete).
     */
    async removeTag(ticketId: number, tagId: number): Promise<void> {
        const assignment = await this.ticketEtiquetaRepo.findOne({
            where: {
                ticketId,
                etiquetaId: tagId,
                estado: 1
            }
        });

        if (!assignment) return; // Not found or already removed

        assignment.estado = 0;
        await this.ticketEtiquetaRepo.save(assignment);
    }
}
