import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { PasoFlujo } from '../entities/paso-flujo.entity';
import { FlujoTransicion } from '../entities/flujo-transicion.entity';
import { Flujo } from '../entities/flujo.entity';
import { Ruta } from '../entities/ruta.entity';
import { RutaPaso } from '../entities/ruta-paso.entity';
import { TicketAsignacionHistorico } from '../../tickets/entities/ticket-asignacion-historico.entity';
import { User } from '../../users/entities/user.entity';
import { TransitionTicketDto } from '../dto/workflow-transition.dto';
import { AssignmentService } from '../../assignments/assignment.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { SlaService } from './sla.service';
import { CheckStartFlowResponseDto, UserCandidateDto } from '../dto/start-flow-check.dto';
import { CheckNextStepResponseDto, DecisionOptionDto } from '../dto/check-next-step.dto';
import { DocumentsService } from '../../documents/services/documents.service';
import { TicketCampoValor } from '../../tickets/entities/ticket-campo-valor.entity';
import { TicketParalelo } from '../../tickets/entities/ticket-paralelo.entity';
import { TicketAsignado } from '../../tickets/entities/ticket-asignado.entity';
import { TemplatesService } from '../../templates/services/templates.service';
import { SignatureStampingService } from './signature-stamping.service';
import { PasoFlujoFirma } from '../entities/paso-flujo-firma.entity';
import { TicketDetalle } from '../../tickets/entities/ticket-detalle.entity';
import { SignParallelTaskDto } from '../dto/sign-parallel-task.dto';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class WorkflowEngineService {
    private readonly logger = new Logger(WorkflowEngineService.name);

    constructor(
        private readonly dataSource: DataSource,
        @InjectRepository(Ticket)
        private readonly ticketRepo: Repository<Ticket>,
        @InjectRepository(PasoFlujo)
        private readonly pasoRepo: Repository<PasoFlujo>,
        @InjectRepository(FlujoTransicion)
        private readonly transicionRepo: Repository<FlujoTransicion>,
        @InjectRepository(Flujo)
        private readonly flujoRepo: Repository<Flujo>,
        @InjectRepository(TicketAsignacionHistorico)
        private readonly historyRepo: Repository<TicketAsignacionHistorico>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        private readonly assignmentService: AssignmentService,
        private readonly notificationsService: NotificationsService,
        private readonly slaService: SlaService,
        private readonly documentsService: DocumentsService,
        @InjectRepository(TicketCampoValor)
        private readonly ticketCampoValorRepo: Repository<TicketCampoValor>,
        private readonly templatesService: TemplatesService,
        private readonly signatureStampingService: SignatureStampingService,
        @InjectRepository(TicketParalelo)
        private readonly ticketParaleloRepo: Repository<TicketParalelo>,
        @InjectRepository(TicketAsignado)
        private readonly ticketAsignadoRepo: Repository<TicketAsignado>,
        @InjectRepository(TicketDetalle)
        private readonly ticketDetalleRepo: Repository<TicketDetalle>,
        @InjectRepository(Ruta)
        private readonly rutaRepo: Repository<Ruta>,
        @InjectRepository(RutaPaso)
        private readonly rutaPasoRepo: Repository<RutaPaso>,
    ) { }

    /**
     * Initializes the workflow for a newly created ticket.
     * Core logic:
     * 1. Finds the initial step (`orden` lowest) for the subcategory's active flow.
     * 2. Resolves the initial assignee (e.g., immediate boss or creator) based on step rules.
     * 3. Updates the ticket with the `pasoActualId` and `usuarioAsignadoIds`.
     * 4. Logs the initial history in `TicketAsignacionHistorico`.
     * 5. Sets the `pasoActual` relation on the returned entity to facilitate immediate usage (e.g. PDF generation).
     * 
     * @param ticket - The newly created ticket (must have ID).
     * @param manualAssigneeId - Optional override for manual assignment if the step requires it.
     * @returns The updated ticket entity with `pasoActual` populated.
     */
    async startTicketFlow(ticket: Ticket, manualAssigneeId?: number): Promise<Ticket> {
        if (!ticket.subcategoriaId) {
            throw new BadRequestException('El ticket debe tener una subcategoría para iniciar un flujo.');
        }

        // 1. Get Initial Step
        const initialStep = await this.getInitialStep(ticket.subcategoriaId);

        // 2. Resolve Assignee
        const assigneeId = await this.resolveStepAssignee(initialStep, ticket, manualAssigneeId);

        // 3. Update Ticket
        ticket.pasoActualId = initialStep.id;
        ticket.usuarioAsignadoIds = assigneeId ? [assigneeId] : [];

        // --- NEW: Create assignment in normalized table ---
        if (assigneeId) {
            const assignment = this.ticketAsignadoRepo.create({
                ticketId: ticket.id,
                usuarioId: assigneeId,
                tipo: 'Principal'
            });
            await this.ticketAsignadoRepo.save(assignment);
        }

        if (assigneeId && initialStep.necesitaAprobacionJefe) {
            // If it's an approval step, store the approver as "Jefe Aprobador"
            ticket.usuarioJefeAprobadorId = assigneeId;
        }

        const savedTicket = await this.ticketRepo.save(ticket);

        // 4. Record History
        const history = this.historyRepo.create({
            ticketId: ticket.id,
            pasoId: initialStep.id,
            usuarioAsignadoId: assigneeId || undefined,
            usuarioAsignadorId: ticket.usuarioId, // Self-triggered by creation
            fechaAsignacion: new Date(),
            comentario: 'Inicio del flujo de trabajo',
            estado: 1,
            estadoTiempoPaso: 'A Tiempo'
        });
        await this.historyRepo.save(history);

        if (assigneeId) {
            const assignee = await this.userRepo.findOne({ where: { id: assigneeId } });
            if (assignee) {
                await this.notificationsService.notifyAssignment(savedTicket, assignee);
            }
        }

        savedTicket.pasoActual = initialStep;

        return savedTicket;
    }

    /**
     * Determines the first step for a new ticket based on Subcategory.
     * Searches for an active Flow (`estado: 1`) associated with the subcategory
     * and returns its first step (lowest `orden`).
     * 
     * @param subcategoriaId - The ID of the ticket's subcategory.
     * @returns The initial `PasoFlujo` entity.
     * @throws NotFoundException if no active flow is found for the subcategory.
     * @throws BadRequestException if the flow exists but has no steps configured.
     */
    async getInitialStep(subcategoriaId: number): Promise<PasoFlujo> {
        const flujo = await this.flujoRepo.findOne({
            where: { subcategoriaId: subcategoriaId, estado: 1 }
        });

        if (!flujo) {
            throw new NotFoundException(`No hay flujo activo configurado para la subcategoría ${subcategoriaId}`);
        }

        const initialStep = await this.pasoRepo.createQueryBuilder('p')
            .leftJoinAndSelect('p.usuarios', 'pfu') // Load explicitly assigned users usage
            .leftJoinAndSelect('pfu.usuario', 'u')
            .where('p.flujoId = :flujoId', { flujoId: flujo.id })
            .andWhere('p.estado = 1')
            .orderBy('p.orden', 'ASC')
            .take(1)
            .getOne();

        if (!initialStep) {
            throw new BadRequestException(`El flujo ${flujo.id} ("${flujo.nombre}") no tiene pasos configurados.`);
        }

        return initialStep;
    }

    /**
     * Checks if the start of the flow requires manual user selection.
     * Returns the list of candidates if so.
     * 
     * @param subcategoriaId - ID of the subcategory
     * @returns DTO with requirements and candidates
     */
    async checkStartFlow(subcategoriaId: number, companyId?: number): Promise<CheckStartFlowResponseDto> {
        const step = await this.getInitialStep(subcategoriaId);

        // ... (existing logic) ...
        // FIXME: Ideally pass the current user from Controller to improve accuracy.
        // For now creating a dummy object for compatibility
        const dummyTicketContext = { usuarioId: -1, usuario: null };

        const candidates = await this.assignmentService.getCandidatesForStep(step, dummyTicketContext);

        if (candidates.length === 0) {
            // Check if it was meant to be automatic but failed (e.g. Boss not found)
            if (step.asignarCreador || step.necesitaAprobacionJefe) {
                // Resolve PDF for auto case too? Although usually auto-step implies instant creation.
                // But if user needs to download it anyway:
                let pdfTemplate = step.nombreAdjunto;
                if (companyId) {
                    const companyTemplate = await this.templatesService.getTemplateForFlow(step.flujoId, companyId);
                    if (companyTemplate) pdfTemplate = companyTemplate.nombrePlantilla;
                }

                return {
                    requiresManualSelection: false,
                    candidates: [],
                    initialStepId: step.id,
                    initialStepName: step.nombre,
                    pdfTemplate: pdfTemplate || undefined
                };
            }
        }

        const candidateDtos: UserCandidateDto[] = candidates.map(u => ({
            id: u.id,
            nombre: u.nombre || '',
            apellido: u.apellido || '',
            email: u.email,
            cargo: u.cargo?.nombre
        }));

        // Determine if manual selection is required
        let requiresManual = !!step.requiereSeleccionManual;

        if (!requiresManual) {
            if (candidateDtos.length > 1) {
                requiresManual = true;
            }
        }

        // Resolve PDF Template
        let pdfTemplate = step.nombreAdjunto;
        if (companyId) {
            const companyTemplate = await this.templatesService.getTemplateForFlow(step.flujoId, companyId);
            if (companyTemplate) {
                pdfTemplate = companyTemplate.nombrePlantilla;
            }
        }

        return {
            requiresManualSelection: requiresManual,
            candidates: candidateDtos,
            initialStepId: step.id,
            initialStepName: step.nombre,
            templateFields: await this.templatesService.getFieldsByStep(step.id),
            pdfTemplate: pdfTemplate || undefined
        };
    }

    /**
     * Checks the next step for a ticket and determines if manual selection is required.
     * Prioritizes linear progression (Strategy C) as the default "next step".
     * 
     * @param ticketId - The ID of the ticket.
     * @returns DTO with requirements and candidates.
     */
    /**
     * Helper to find the next step based on current step and transition key (or linear fallback).
     * Centralizes logic for strategies A, B, and C.
     */
    private async resolveNextStep(currentStep: PasoFlujo, transitionKeyOrId?: string): Promise<{ nextStep: PasoFlujo | null, transitionUsed: FlujoTransicion | null }> {
        let nextStep: PasoFlujo | null = null;
        let transitionUsed: FlujoTransicion | null = null;

        // Strategy A: Explicit Transition by Condition Key
        if (transitionKeyOrId && isNaN(Number(transitionKeyOrId))) {
            const transition = await this.transicionRepo.findOne({
                where: {
                    pasoOrigenId: currentStep.id,
                    condicionClave: transitionKeyOrId,
                    estado: 1
                },
                relations: ['pasoDestino']
            });
            if (transition && transition.pasoDestino) {
                nextStep = transition.pasoDestino;
                transitionUsed = transition;
            }
        }

        // Strategy B: Explicit Target Step ID
        if (!nextStep && transitionKeyOrId && !isNaN(Number(transitionKeyOrId))) {
            nextStep = await this.pasoRepo.findOne({ where: { id: Number(transitionKeyOrId) } });
        }

        // Strategy C: Linear Sequence (Next Order)
        if (!nextStep) {
            nextStep = await this.pasoRepo.createQueryBuilder('p')
                .where('p.flujoId = :flujoId', { flujoId: currentStep.flujoId })
                .andWhere('p.orden > :orden', { orden: currentStep.orden })
                .andWhere('p.estado = 1')
                .orderBy('p.orden', 'ASC')
                .getOne();
        }

        return { nextStep, transitionUsed };
    }

    /**
     * Checks the next step for a ticket and determines if manual selection is required.
     */

    private async detectMissingRolesForStep(step: PasoFlujo, ticket: Ticket): Promise<{ id: number; name: string }[]> {
        if (!step.esParalelo) return [];

        const signatures = await this.pasoRepo.createQueryBuilder()
            .relation(PasoFlujo, 'firmas')
            .of(step)
            .loadMany<PasoFlujoFirma>();

        // We also need to load the 'cargo' relation for the signature names? 
        // PasoFlujoFirma has 'cargoId'. We need the name.
        // The relation might not be loaded by .relation().loadMany().
        // Better query:
        const fullSignatures = await this.pasoRepo.manager.find(PasoFlujoFirma, {
            where: { pasoId: step.id, estado: 1 },
            relations: ['cargo']
        });

        const missing: { id: number; name: string }[] = [];

        for (const sig of fullSignatures) {
            if (sig.usuarioId) continue; // Specific user assigned, no fallback needed
            if (sig.cargoId) {
                const candidates = await this.assignmentService.getUsersByRole(sig.cargoId, ticket.empresaId, ticket.regionalId ?? undefined);
                if (candidates.length === 0) {
                    const name = sig.cargoId === -1 ? 'Jefe Inmediato' : (sig.cargo?.nombre || `Cargo ${sig.cargoId}`);
                    missing.push({ id: sig.cargoId, name });
                }
            }
        }
        return missing;
    }

    async checkNextStep(ticketId: number): Promise<CheckNextStepResponseDto> {
        const ticket = await this.ticketRepo.findOne({
            where: { id: ticketId },
            relations: ['pasoActual', 'usuario'] // Load 'usuario' for context
        });

        if (!ticket) throw new NotFoundException(`Ticket ${ticketId} not found`);
        const currentStep = ticket.pasoActual;
        if (!currentStep) throw new BadRequestException('Ticket has no current step');

        // 1. Check for Explicit Decisions (FlujoTransicion)
        const decisions = await this.transicionRepo.find({
            where: { pasoOrigenId: currentStep.id, estado: 1 },
            relations: ['pasoDestino', 'ruta']
        });

        if (decisions.length > 0) {
            // Decision Branch
            const decisionOptions = await Promise.all(decisions.map(async (d) => {
                let targetStep = d.pasoDestino;
                let isRoute = false;

                // Handle Route Transition
                if (!targetStep && d.rutaId) {
                    // Find first step of the route
                    const routeStart = await this.rutaPasoRepo.findOne({
                        where: { rutaId: d.rutaId, estado: 1 },
                        order: { orden: 'ASC' },
                        relations: ['paso']
                    });
                    if (routeStart?.paso) {
                        targetStep = routeStart.paso;
                        isRoute = true;
                    }
                }

                if (!targetStep) return null; // Skip invalid transitions

                // Unified candidate check
                const candidates = await this.assignmentService.getCandidatesForStep(targetStep, ticket);
                // Convert to DTO
                const candidateDtos: UserCandidateDto[] = candidates.map(u => ({
                    id: u.id,
                    nombre: u.nombre || '',
                    apellido: u.apellido || '',
                    email: u.email,
                    cargo: u.cargo?.nombre
                }));

                // Determine manual requirement (Role = manual, Multiple = manual)
                const isRoleAssignment = !!targetStep.cargoAsignadoId;
                const missingRoles = await this.detectMissingRolesForStep(targetStep, ticket);
                const requiresManual = isRoleAssignment || candidateDtos.length > 1 || missingRoles.length > 0;

                if (missingRoles.length > 0 || (candidates.length === 0 && requiresManual)) {
                    // Fallback: If we have specific missing roles OR general failure to find assignee,
                    // we must provide the FULL list of users so the manual selector has options.
                    const allUsers = await this.userRepo.find({
                        where: { estado: 1, empresas: { id: ticket.empresaId } },
                        relations: ['cargo']
                    });
                    const fallbackDtos = allUsers.map(u => ({
                        id: u.id,
                        nombre: u.nombre || '',
                        apellido: u.apellido || '',
                        email: u.email,
                        cargo: u.cargo?.nombre
                    }));

                    // Replace/Fill candidate list with all users
                    candidateDtos.splice(0, candidateDtos.length, ...fallbackDtos);
                }

                return {
                    decisionId: d.condicionClave || '',
                    label: d.condicionNombre || (isRoute ? `Ruta: ${d.ruta?.nombre}` : (d.condicionClave || 'Opción')),
                    targetStepId: targetStep.id,
                    requiresManualAssignment: requiresManual,
                    candidates: candidateDtos,
                    missingRoles: missingRoles.length > 0 ? missingRoles : undefined,
                    isRoute: isRoute
                };
            }));

            // Filter out nulls (invalid transitions)
            const validDecisions = decisionOptions.filter(d => d !== null) as DecisionOptionDto[];

            if (validDecisions.length > 0) {
                return {
                    transitionType: 'decision',
                    decisions: validDecisions
                };
            }
            // If no valid decisions found (e.g. Broken routes), fallback to linear?? 
            // Better to return empty or fallback. Let's fallback to linear if decisions array is empty after filter.
        }

        // 2. Linear Progression (Fallback)
        // Use central resolver (without key implies linear)
        const { nextStep } = await this.resolveNextStep(currentStep);

        if (!nextStep) {
            return {
                transitionType: 'final'
            };
        }

        // Check assignment for linear step
        const candidates = await this.assignmentService.getCandidatesForStep(nextStep, ticket);
        const candidateDtos: UserCandidateDto[] = candidates.map(u => ({
            id: u.id,
            nombre: u.nombre || '',
            apellido: u.apellido || '',
            email: u.email,
            cargo: u.cargo?.nombre
        }));
        const isRoleAssignment = !!nextStep.cargoAsignadoId;
        const missingRoles = await this.detectMissingRolesForStep(nextStep, ticket);
        const requiresManual = isRoleAssignment || candidateDtos.length > 1 || missingRoles.length > 0;

        if (missingRoles.length > 0 || (candidates.length === 0 && requiresManual)) {
            // Fallback for linear/parallel
            const allUsers = await this.userRepo.find({
                where: { estado: 1, empresas: { id: ticket.empresaId } },
                relations: ['cargo']
            });
            const fallbackDtos = allUsers.map(u => ({
                id: u.id,
                nombre: u.nombre || '',
                apellido: u.apellido || '',
                email: u.email,
                cargo: u.cargo?.nombre
            }));
            // Replace/Fill candidate list with all users
            candidateDtos.splice(0, candidateDtos.length, ...fallbackDtos);
        }

        return {
            transitionType: 'linear',
            linear: {
                targetStepId: nextStep.id,
                targetStepName: nextStep.nombre,
                requiresManualAssignment: requiresManual,
                candidates: candidateDtos,
                missingRoles: missingRoles.length > 0 ? missingRoles : undefined
            },
            ...(nextStep.esParalelo ? {
                parallelStatus: {
                    isBlocked: false,
                    pendingTasks: []
                }
            } : {})
        };
    }



    /**
     * Executes a state transition for a ticket.
     * This core method handles the movement of a ticket from one step to another,
     * resolving the destination step and the responsible agent automatically.
     * 
     * Logic:
     * 1. Validates that the ticket exists and has a current step.
     * 2. Determines the `nextStep`:
     *    - **Strategy A**: Checks `flujo_transiciones` for a matching `condicionClave` (e.g., 'Approved').
     *    - **Strategy B**: Checks if `transitionKeyOrStepId` is a direct Step ID (Admin override).
     *    - **Strategy C**: Default linear progression (Next step by `orden`).
     * 3. Resolves the `Assignee` (User ID) for the next step using `AssignmentService`:
     *    - Creation assignment, Immediate Boss, or Regional Role.
     * 4. Updates the ticket (`pasoActualId`, `usuarioAsignadoIds`, `estado`).
     * 5. Records the action in `TicketAsignacionHistorico`.
     * 
     * @param dto - Data transfer object containing ticket ID, transition key/step ID, and optional comments.
     * @returns The updated `Ticket` entity.
     * @throws NotFoundException if ticket is not found.
     * @throws BadRequestException if transition is invalid or next step cannot be determined.
     */
    async transitionStep(dto: TransitionTicketDto): Promise<Ticket> {
        return await this.dataSource.transaction(async (manager) => {
            // Transactional Repositories
            const txTicketRepo = manager.getRepository(Ticket);
            const txTicketParaleloRepo = manager.getRepository(TicketParalelo);
            const txTicketAsignadoRepo = manager.getRepository(TicketAsignado);
            const txHistoryRepo = manager.getRepository(TicketAsignacionHistorico);
            const txTicketDetalleRepo = manager.getRepository(TicketDetalle);

            // 1. Fetch Ticket with Lock to prevent race conditions
            const ticket = await txTicketRepo.findOne({
                where: { id: dto.ticketId },
                relations: ['pasoActual', 'usuario'],
                lock: { mode: 'pessimistic_write' }
            });

            if (!ticket) throw new NotFoundException(`Ticket ${dto.ticketId} not found`);

            const currentStep = ticket.pasoActual;
            if (!currentStep) throw new BadRequestException('Ticket has no current step');

            // 1.1 Handle Parallel Step Approval (If current step is parallel)
            if (currentStep.esParalelo) {
                // Check pending parallel task for this user
                const pendingParallel = await txTicketParaleloRepo.findOne({
                    where: {
                        ticketId: ticket.id,
                        pasoId: currentStep.id,
                        usuarioId: dto.actorId,
                        estado: 'Pendiente'
                    }
                });

                if (pendingParallel) {
                    // This logic should ideally be handled by signParallelTask, but if reached here:
                    pendingParallel.estado = 'Aprobado';
                    pendingParallel.fechaCierre = new Date();
                    pendingParallel.comentario = dto.comentario || null;
                    await txTicketParaleloRepo.save(pendingParallel);

                    // Stamp Parallel Signature (Sequential)
                    const masterPdfPath = path.resolve(process.cwd(), 'public', 'documentos', ticket.id.toString(), `ticket_${ticket.id}.pdf`);
                    try {
                        await fs.access(masterPdfPath);
                        const signedBuffer = await this.signatureStampingService.stampSignaturesForStep(
                            masterPdfPath,
                            currentStep.id,
                            ticket.id,
                            dto.actorId
                        );
                        await fs.writeFile(masterPdfPath, signedBuffer);
                    } catch (e) {
                        this.logger.warn(`Parallel signing failed: ${e.message}`);
                    }

                    // Check if ALL are approved
                    const remaining = await txTicketParaleloRepo.count({
                        where: {
                            ticketId: ticket.id,
                            pasoId: currentStep.id,
                            estado: 'Pendiente'
                        }
                    });

                    if (remaining > 0) {
                        this.logger.log(`Ticket ${ticket.id} approved by ${dto.actorId} but waiting for ${remaining} others.`);
                        return ticket;
                    }
                } else {
                    // Check specific blocking condition
                    const remainingTasks = await txTicketParaleloRepo.count({
                        where: {
                            ticketId: ticket.id,
                            pasoId: currentStep.id,
                            estado: 'Pendiente'
                        }
                    });

                    if (remainingTasks > 0) {
                        throw new BadRequestException(
                            `No se puede avanzar. Este es un paso paralelo con ${remainingTasks} tarea(s) pendiente(s). ` +
                            `Todos los participantes deben completar sus firmas antes de avanzar.`
                        );
                    }
                }
            }

            // 2. Determine Next Step
            const { nextStep, transitionUsed } = await this.resolveNextStep(currentStep, dto.transitionKeyOrStepId);

            if (!nextStep) throw new BadRequestException(`No se encontró un paso siguiente válido.`);

            // 3. Resolve Assignee
            const assigneeId = await this.resolveStepAssignee(nextStep, ticket, dto.targetUserId);

            // 3.1 Initialize Parallel Entries (If next step is parallel)
            let parallelAssignees: number[] = [];
            if (nextStep.esParalelo) {
                // Fetch signatures required for next step
                // We use manager to ensure consistency
                const signatures = await manager.createQueryBuilder(PasoFlujoFirma, 'sig')
                    .leftJoinAndSelect('sig.cargo', 'cargo')
                    .where('sig.pasoId = :pasoId', { pasoId: nextStep.id })
                    .andWhere('sig.estado = :estado', { estado: 1 })
                    .getMany();

                for (const sig of signatures) {
                    let targetUserId: number | null = sig.usuarioId;
                    if (!targetUserId && sig.cargoId) {
                        const candidates = await this.assignmentService.getUsersByRole(sig.cargoId, ticket.empresaId, ticket.regionalId ?? undefined);

                        if (dto.manualAssignments && dto.manualAssignments[sig.cargoId]) {
                            targetUserId = dto.manualAssignments[sig.cargoId];
                        } else if (candidates.length > 0) {
                            targetUserId = candidates[0].id; // Pick first auto
                        } else if (dto.targetUserId) {
                            targetUserId = dto.targetUserId;
                        }
                    }

                    if (targetUserId) {
                        parallelAssignees.push(targetUserId);

                        // Check existence to prevent duplicate errors on retry (self-healing)
                        const existing = await txTicketParaleloRepo.findOne({
                            where: { ticketId: ticket.id, pasoId: nextStep.id, usuarioId: targetUserId }
                        });

                        if (!existing) {
                            const tp = txTicketParaleloRepo.create({
                                ticketId: ticket.id,
                                pasoId: nextStep.id,
                                usuarioId: targetUserId,
                                estado: 'Pendiente',
                                activo: 1
                            });
                            await txTicketParaleloRepo.save(tp);
                        }
                    }
                }
            }

            // 4. Update Ticket with new Step
            ticket.pasoActual = nextStep; // Update relation object
            ticket.pasoActualId = nextStep.id; // Update ID

            if (nextStep.esParalelo && parallelAssignees.length > 0) {
                ticket.usuarioAsignadoIds = parallelAssignees;
            } else {
                ticket.usuarioAsignadoIds = assigneeId ? [assigneeId] : [];
            }

            // 4.1 Sync with normalized table
            await txTicketAsignadoRepo.delete({ ticketId: ticket.id });

            const newUserIds = (nextStep.esParalelo && parallelAssignees.length > 0)
                ? parallelAssignees
                : (assigneeId ? [assigneeId] : []);

            const newAssignmentEntities = newUserIds.map(uid => txTicketAsignadoRepo.create({
                ticketId: ticket.id,
                usuarioId: uid,
                tipo: nextStep.esParalelo ? 'Paralelo' : 'Principal',
                fechaAsignacion: new Date()
            }));

            if (newAssignmentEntities.length > 0) {
                await txTicketAsignadoRepo.save(newAssignmentEntities);
            }

            const savedTicket = await txTicketRepo.save(ticket);
            this.logger.log(`Ticket ${savedTicket.id} moved to step ${nextStep.id} (${nextStep.nombre})`);

            // 5. Handle Signature Stamping for PREVIOUS Step (Sequential)
            // (Filesystem operations are side-effects, we do them here)
            let signaturePath: string | null = null;
            const masterPdfPath = path.resolve(process.cwd(), 'public', 'documentos', ticket.id.toString(), `ticket_${ticket.id}.pdf`);
            let sourcePath = masterPdfPath;

            try {
                await fs.access(masterPdfPath);
            } catch {
                sourcePath = '';
            }

            if (sourcePath) {
                try {
                    const signedBuffer = await this.signatureStampingService.stampSignaturesForStep(
                        sourcePath,
                        currentStep.id,
                        ticket.id
                    );
                    await fs.writeFile(masterPdfPath, signedBuffer);
                    const filename = `ticket_${ticket.id}_step_${currentStep.id}_signed.pdf`;
                    await this.documentsService.saveTicketFile(ticket.id, Buffer.from(signedBuffer), filename);
                    signaturePath = filename;
                } catch (e) {
                    this.logger.warn(`Sequential signing failed for Ticket ${ticket.id}: ${e.message}`);
                }
            }

            // Legacy Signature Support
            if (dto.signature) {
                try {
                    const base64Data = dto.signature.replace(/^data:image\/\w+;base64,/, "");
                    const buffer = Buffer.from(base64Data, 'base64');
                    const filename = `signature_drawing_${Date.now()}.png`;
                    await this.documentsService.saveTicketFile(ticket.id, buffer, filename);
                    if (!signaturePath) signaturePath = filename;
                } catch (e) {
                    this.logger.error(`Failed to save signature`, e);
                }
            }

            // 6. Save User Comment (if any)
            if (dto.comentario) {
                const commentDetails = txTicketDetalleRepo.create({
                    ticketId: ticket.id,
                    usuarioId: dto.actorId,
                    descripcion: dto.comentario,
                    fechaCreacion: new Date(),
                    estado: 1
                });
                await txTicketDetalleRepo.save(commentDetails);
            }

            // 7. Record History
            const primaryAssigneeForHistory = nextStep.esParalelo && parallelAssignees.length > 0
                ? parallelAssignees[0]
                : assigneeId;

            const history = txHistoryRepo.create({
                ticketId: ticket.id,
                pasoId: nextStep.id,
                usuarioAsignadoId: primaryAssigneeForHistory || undefined,
                usuarioAsignadorId: dto.actorId,
                fechaAsignacion: new Date(),
                comentario: transitionUsed?.condicionNombre
                    ? `Transición: ${transitionUsed.condicionNombre}`
                    : (nextStep.esParalelo ? `Asignación Paralela para paso: ${nextStep.nombre}` : `Avanzó al paso: ${nextStep.nombre}`),
                estado: 1,
                estadoTiempoPaso: 'A Tiempo',
                firmaPath: signaturePath
            });
            await txHistoryRepo.save(history);

            // Parallel Assignments History (Secondary)
            if (nextStep.esParalelo && parallelAssignees.length > 1) {
                for (let i = 1; i < parallelAssignees.length; i++) {
                    const pUid = parallelAssignees[i];
                    const hPar = txHistoryRepo.create({
                        ticketId: ticket.id,
                        pasoId: nextStep.id,
                        usuarioAsignadoId: pUid,
                        usuarioAsignadorId: dto.actorId,
                        fechaAsignacion: new Date(),
                        comentario: `Asignación Paralela para paso: ${nextStep.nombre}`,
                        estado: 1,
                        estadoTiempoPaso: 'Pendiente',
                        firmaPath: null
                    });
                    await txHistoryRepo.save(hPar);
                }
            }

            // 8. Dynamic Fields
            if (dto.templateValues && dto.templateValues.length > 0) {
                const valuesToSave = dto.templateValues.map(tv => this.ticketCampoValorRepo.create({
                    ticketId: ticket.id,
                    campoId: tv.campoId,
                    valor: tv.valor,
                    estado: 1
                }));
                await manager.save(TicketCampoValor, valuesToSave);
            }

            // Notifications can be fire-and-forget or awaited outside
            if (assigneeId) {
                this.userRepo.findOne({ where: { id: assigneeId } }).then(assignee => {
                    if (assignee) this.notificationsService.notifyAssignment(savedTicket, assignee);
                });
            }

            return savedTicket;
        });
    }

    /**
     * Approves a ticket flow (used by Bosses/Approvers).
     * Typically resets the flow to the first support step.
     * 
     * @param ticketId - The ID of the ticket to approve.
     * @param approverId - The ID of the user attempting to approve (must match assigned approver).
     * @throws NotFoundException if ticket not found.
     * @throws ForbiddenException (via warning) if approver mismatch.
     */
    async approveFlow(ticketId: number, approverId: number): Promise<void> {
        const ticket = await this.ticketRepo.findOne({ where: { id: ticketId }, relations: ['pasoActual'] });
        if (!ticket) throw new NotFoundException('Ticket not found');

        // Verify Approver
        if (ticket.usuarioJefeAprobadorId && ticket.usuarioJefeAprobadorId !== approverId) {
            // throw new ForbiddenException('No tienes permiso para aprobar este ticket');
            this.logger.warn(`User ${approverId} tried to approve ticket ${ticketId} but is not the assigned approver ${ticket.usuarioJefeAprobadorId}`);
        }

        // Find First Support Step (assuming it's the first step of the flow that is NOT an approval step)
        // Or simply the next step using 'aprobado' key?
        // Legacy "approveFlow" logic often reset to the first step of the flow or next.
        // Let's assume we try to transition with 'aprobado' key first.

        try {
            await this.transitionStep({
                ticketId,
                actorId: approverId,
                transitionKeyOrStepId: 'aprobado',
                comentario: 'Aprobado por Jefe Inmediato'
            });
        } catch (e) {
            // If explicit transition fails, fallback to finding the first step > current that is NOT approval
            this.logger.log('No "aprobado" transition found, falling back to next support step');

            const nextStep = await this.pasoRepo.createQueryBuilder('p')
                .where('p.flujoId = :flujoId', { flujoId: ticket.pasoActual.flujoId })
                .andWhere('p.orden > :orden', { orden: ticket.pasoActual.orden })
                .andWhere('p.esAprobacion = 0') // Not an approval step
                .andWhere('p.estado = 1')
                .orderBy('p.orden', 'ASC')
                .getOne();

            if (nextStep) {
                await this.transitionStep({
                    ticketId,
                    actorId: approverId,
                    transitionKeyOrStepId: String(nextStep.id),
                    comentario: 'Aprobado (Salto a paso de soporte)'
                });
            } else {
                throw new BadRequestException('No se pudo determinar el siguiente paso tras la aprobación.');
            }
        }
    }

    /**
     * Resolves the user ID that should be assigned to the ticket in a specific step.
     * 
     * Resolution Priority:
     * 0. **Manual Override**: If `manualAssigneeId` is provided (and valid).
     * 1. **Assign to Creator**: If `step.asignarCreador` is true.
     * 2. **Immediate Boss**: If `step.necesitaAprobacionJefe` is true.
     * 3. **Role & Region**: If `step.cargoAsignadoId` is set, finds a user with that Role in the Ticket Creator's Region.
     * 
     * @param step - The destination step entity.
     * @param ticket - The ticket being processed (needed for creator context).
     * @param manualAssigneeId - Optional override.
     * @returns The User ID of the assignee, or `null` if unassigned (pool).
     */
    /**
     * Resolves the user ID that should be assigned to the ticket in a specific step.
     */
    private async resolveStepAssignee(step: PasoFlujo, ticket: Ticket, manualAssigneeId?: number): Promise<number | null> {
        // 0. Manual Override
        if (manualAssigneeId) {
            return manualAssigneeId;
        }

        // 1. Get Candidates via unified service
        const candidates = await this.assignmentService.getCandidatesForStep(step, ticket);

        // 2. Logic to pick one
        if (candidates.length === 0) return null;

        // If exactly one candidate, auto-assign
        if (candidates.length === 1) return candidates[0].id;

        // If multiple candidates... 
        // In a transition flow (not prediction), if we reached here without a manualAssigneeId,
        // it means the user sent "Execute" without picking one, OR it's an automatic system transition.
        // We can:
        // A) Pick the first one (Round Robin? Random?)
        // B) Leave Unassigned (Pool)

        // For legacy compatibility, if it's a Role step, we often leave it unassigned (null) so it goes to the pool.
        // But if it was Creator/Boss, we resolved it.

        if (step.asignarCreador || step.necesitaAprobacionJefe) {
            return candidates[0].id;
        }

        // For Roles with multiple people, return null => Pool
        return null;
    }

    /**
     * Signs an individual parallel task.
     * When the last parallel user signs, automatically advances the ticket.
     * 
     * @param dto - Contains ticketId, optional comment and signature
     * @param userId - ID of the user signing
     * @returns Updated ticket if auto-advanced, or confirmation message
     */
    async signParallelTask(dto: SignParallelTaskDto, userId: number): Promise<{ message: string; autoAdvanced: boolean; ticket?: Ticket }> {
        const { ticketId, comentario, signature } = dto;

        // 1. Find user's pending parallel task
        const task = await this.ticketParaleloRepo.findOne({
            where: {
                ticketId,
                usuarioId: userId,
                estado: 'Pendiente'
            },
            relations: ['paso', 'ticket']
        });

        if (!task) {
            throw new NotFoundException('No tienes una tarea paralela pendiente para este ticket');
        }

        // 2. Update task status
        task.estado = 'Completado';
        task.fechaCierre = new Date();
        task.comentario = comentario || null;
        await this.ticketParaleloRepo.save(task);

        // 3. Save signature & Stamp immediately
        if (signature) {
            try {
                // 3a. Save File
                const base64Data = signature.replace(/^data:image\/\w+;base64,/, "");
                const buffer = Buffer.from(base64Data, 'base64');
                const filename = `parallel_signature_user${userId}_${Date.now()}.png`;
                await this.documentsService.saveTicketFile(ticketId, buffer, filename);

                // 3b. Stamp PDF (using the file we just saved)
                const masterPdfPath = path.resolve(process.cwd(), 'public', 'documentos', ticketId.toString(), `ticket_${ticketId}.pdf`);
                const signatureAbsolutePath = path.resolve(process.cwd(), 'public', 'documentos', ticketId.toString(), filename);

                await fs.access(masterPdfPath);

                // Pass signatureAbsolutePath to stamp ONLY this signature using the fresh file
                const signedBuffer = await this.signatureStampingService.stampSignaturesForStep(
                    masterPdfPath,
                    task.pasoId,
                    ticketId,
                    userId,
                    signatureAbsolutePath
                );

                await fs.writeFile(masterPdfPath, signedBuffer);
                this.logger.log(`Stamped signature for user ${userId} on ticket ${ticketId}`);

            } catch (e) {
                this.logger.warn(`Failed to handle parallel signature for user ${userId}: ${e.message}`);
            }
        }


        // 4. Record comment if provided
        if (comentario) {
            const commentDetails = this.ticketDetalleRepo.create({
                ticketId,
                usuarioId: userId,
                descripcion: comentario,
                fechaCreacion: new Date(),
                estado: 1
            });
            await this.ticketDetalleRepo.save(commentDetails);
        }

        // 5. Check if all parallel tasks are completed
        const allTasks = await this.ticketParaleloRepo.find({
            where: {
                ticketId,
                pasoId: task.pasoId,
                activo: 1
            }
        });

        const pendingTasks = allTasks.filter(t => t.estado !== 'Completado');

        if (pendingTasks.length === 0) {
            // All tasks completed - auto-advance
            this.logger.log(`All parallel tasks completed for ticket ${ticketId}. Auto-advancing...`);

            // Find next step
            const currentStep = task.paso;
            const { nextStep } = await this.resolveNextStep(currentStep, undefined);

            if (!nextStep) {
                return {
                    message: 'Firma registrada. Este es el último paso del flujo.',
                    autoAdvanced: false
                };
            }

            // Auto-transition
            const updatedTicket = await this.transitionStep({
                ticketId,
                actorId: userId,
                transitionKeyOrStepId: nextStep.id.toString(),
                comentario: 'Avance automático: Todas las firmas paralelas completadas'
            });

            return {
                message: 'Firma registrada. Todas las firmas completadas. Ticket avanzado automáticamente.',
                autoAdvanced: true,
                ticket: updatedTicket
            };
        }

        // Still waiting for other signatures
        return {
            message: `Firma registrada correctamente. Esperando ${pendingTasks.length} firma(s) pendiente(s).`,
            autoAdvanced: false
        };
    }
}
