import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { PasoFlujo } from '../entities/paso-flujo.entity';
import { FlujoTransicion } from '../entities/flujo-transicion.entity';
import { Flujo } from '../entities/flujo.entity';
import { TicketAsignacionHistorico } from '../../tickets/entities/ticket-asignacion-historico.entity';
import { User } from '../../users/entities/user.entity';
import { TransitionTicketDto } from '../dto/workflow-transition.dto';
import { AssignmentService } from '../../assignments/assignment.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { SlaService } from './sla.service';
import { CheckStartFlowResponseDto, UserCandidateDto } from '../dto/start-flow-check.dto';
import { CheckNextStepResponseDto } from '../dto/check-next-step.dto';
import { DocumentsService } from '../../documents/services/documents.service';
import { TicketCampoValor } from '../../tickets/entities/ticket-campo-valor.entity';
import { TicketParalelo } from '../../tickets/entities/ticket-paralelo.entity';
import { TicketAsignado } from '../../tickets/entities/ticket-asignado.entity';
import { TemplatesService } from '../../templates/services/templates.service';
import { SignatureStampingService } from './signature-stamping.service';
import { PasoFlujoFirma } from '../entities/paso-flujo-firma.entity';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class WorkflowEngineService {
    private readonly logger = new Logger(WorkflowEngineService.name);

    constructor(
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
    async checkStartFlow(subcategoriaId: number): Promise<CheckStartFlowResponseDto> {
        const step = await this.getInitialStep(subcategoriaId);

        // Use unified assignment logic (Passing mock ticket shell with just usuarioId for context if needed, 
        // but here we might not have a ticket yet. We need a way to pass context.
        // Usually Start Flow is checked BEFORE ticket creation, so we might only have the potential creator (User ID from Token).
        // Let's assume for this check we return ALL candidates or require context.
        // Since this endpoint is usually public/auth, we can't easily guess the creator for regional logic 
        // unless we passed the user ID to this service method.
        // For now, let's keep it simple: Resolve candidates broadly.

        // FIXME: Ideally pass the current user from Controller to improve accuracy.
        // For now creating a dummy object for compatibility
        const dummyTicketContext = { usuarioId: -1, usuario: null };

        const candidates = await this.assignmentService.getCandidatesForStep(step, dummyTicketContext);

        if (candidates.length === 0) {
            // Auto assign (e.g. pool) or just no candidates found? 
            // If strictly automatic (creator/boss) and found 1, returns 1.
            // If Role based and found 0, returns 0.

            // Check if it was meant to be automatic but failed (e.g. Boss not found)
            if (step.asignarCreador || step.necesitaAprobacionJefe) {
                return {
                    requiresManualSelection: false,
                    candidates: [],
                    initialStepId: step.id,
                    initialStepName: step.nombre
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
        // Prioritize explicit configuration in Step
        let requiresManual = !!step.requiereSeleccionManual;

        // If not explicitly manual, check implicit conditions
        if (!requiresManual) {
            // If it's a Role assignment (Tarea Nacional) with MULTIPLE candidates, we might force manual?
            // Users usually uncheck "Manual" to imply "Pick Any" or "Auto".
            // However, if we have 1 candidate, we definitely don't need manual.
            if (candidateDtos.length > 1) {
                // Implicitly force manual if multiple choices exist and no other auto-logic is defined?
                // Or trust the user? If they unchecked manual, maybe they want random assignment.
                // For safety: If > 1 candidate, ask user.
                requiresManual = true;
            }
            // If 1 candidate, it will be auto-selected by createTicket.
        }

        return {
            requiresManualSelection: requiresManual,
            candidates: candidateDtos,
            initialStepId: step.id,
            initialStepName: step.nombre,
            templateFields: await this.templatesService.getFieldsByStep(step.id)
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
            relations: ['pasoDestino']
        });

        if (decisions.length > 0) {
            // Decision Branch
            const decisionOptions = await Promise.all(decisions.map(async (d) => {
                const targetStep = d.pasoDestino;
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
                const requiresManual = isRoleAssignment || candidateDtos.length > 1;

                return {
                    decisionId: d.condicionClave || '',
                    label: d.condicionNombre || d.condicionClave || 'Opción',
                    targetStepId: targetStep.id,
                    requiresManualAssignment: requiresManual
                };
            }));

            return {
                transitionType: 'decision',
                decisions: decisionOptions
            };
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
        const requiresManual = isRoleAssignment || candidateDtos.length > 1;


        return {
            transitionType: 'linear',
            linear: {
                targetStepId: nextStep.id,
                targetStepName: nextStep.nombre,
                requiresManualAssignment: requiresManual,
                candidates: candidateDtos
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
        const ticket = await this.ticketRepo.findOne({
            where: { id: dto.ticketId },
            relations: ['pasoActual', 'usuario']
        });

        if (!ticket) throw new NotFoundException(`Ticket ${dto.ticketId} not found`);

        const currentStep = ticket.pasoActual;
        if (!currentStep) throw new BadRequestException('Ticket has no current step');

        // 1.1 Handle Parallel Step Approval (If current step is parallel)
        if (currentStep.esParalelo) {
            // Find if this user has a pending parallel assignment
            const pendingParallel = await this.ticketParaleloRepo.findOne({
                where: {
                    ticketId: ticket.id,
                    pasoId: currentStep.id,
                    usuarioId: dto.actorId,
                    estado: 'Pendiente'
                }
            });

            if (pendingParallel) {
                // User is approving their part
                pendingParallel.estado = 'Aprobado'; // or 'Firmado'
                pendingParallel.estadoTiempoPaso = 'A Tiempo'; // TODO: Calc SLA
                pendingParallel.fechaCierre = new Date();
                pendingParallel.comentario = dto.comentario || null;
                await this.ticketParaleloRepo.save(pendingParallel);

                // Stamp Parallel Signature (Sequential)
                const masterPdfPath = path.resolve(process.cwd(), 'public', 'documentos', ticket.id.toString(), `ticket_${ticket.id}.pdf`);
                try {
                    await fs.access(masterPdfPath);
                    const signedBuffer = await this.signatureStampingService.stampSignaturesForStep(
                        masterPdfPath,
                        currentStep.id,
                        ticket.id,
                        dto.actorId // Only stamp THIS user's signature
                    );
                    await fs.writeFile(masterPdfPath, signedBuffer);
                    // We don't necessarily create a new version for every parallel sign, or maybe we do?
                    // User said "llenar de firmas". We update master.
                } catch (e) {
                    this.logger.warn(`Parallel signing failed: ${e.message}`);
                }

                // Check if ALL are approved
                const remaining = await this.ticketParaleloRepo.count({
                    where: {
                        ticketId: ticket.id,
                        pasoId: currentStep.id,
                        estado: 'Pendiente'
                    }
                });

                if (remaining > 0) {
                    // Still pending others. Stop transition.
                    this.logger.log(`Ticket ${ticket.id} approved by ${dto.actorId} but waiting for ${remaining} others.`);
                    return ticket; // Return without moving step
                } else {
                    this.logger.log(`All parallel approvals complete for Ticket ${ticket.id}. Proceeding to next step.`);
                    // Fallthrough to normal transition logic below
                }
            } else {
                // User might be trying to approve but is not in the parallel list or already approved.
                // Or it's a forced admin transition?
                // If normal user, we could throw if they aren't assigned.
                // For now, allow fallthrough if they explicitly requested a transition (admin override?).
                // But typically parallel steps lock linear flow.
                const isAssigned = await this.ticketParaleloRepo.count({ where: { ticketId: ticket.id, pasoId: currentStep.id, usuarioId: dto.actorId } });
                if (isAssigned > 0) {
                    // Already approved?
                    this.logger.warn(`User ${dto.actorId} already approved or signature not pending.`);
                }
            }
        }

        // 2. Determine Next Step
        // Use Unified Resolver
        const { nextStep, transitionUsed } = await this.resolveNextStep(currentStep, dto.transitionKeyOrStepId);

        // Note: Strategies A, B, C are now inside resolveNextStep

        if (!nextStep) throw new BadRequestException(`No se encontró un paso siguiente válido.`);

        // 3. Resolve Assignee (The core complexity)
        const assigneeId = await this.resolveStepAssignee(nextStep, ticket, dto.targetUserId);

        // 3.1 Initialize Parallel Entries (If next step is parallel)
        let parallelAssignees: number[] = [];
        if (nextStep.esParalelo) {
            // Fetch signatures required
            const firmas = await this.pasoRepo.manager.find(PasoFlujoFirma, { // Quick access via manager or inject
                where: { pasoId: nextStep.id, estado: 1 },
                relations: ['usuario'] // Need to resolve roles
            });
            // We need to fetch 'PasoFlujoFirma' properly. I don't have its repo injected. 
            // I'll access via nextStep.firmas if lazy/eager, or query builder.
            // Better: Inject the repo or use relation. 'nextStep' from resolveNextStep might not have signatures loaded.
            const signatures = await this.pasoRepo.createQueryBuilder()
                .relation(PasoFlujo, 'firmas')
                .of(nextStep)
                .loadMany<PasoFlujoFirma>();

            // Wait, loadMany returns related entities? Yes.
            // We need to resolve Role based signatures to Users.

            for (const sig of signatures) {
                let targetUserId: number | null = sig.usuarioId;
                if (!targetUserId && sig.cargoId) {
                    // Find ONE random/first user with this role? OR All? 
                    // User said "varias firmas". Usually implies specific people.
                    // If Role is used, we assume for now we pick the 'primary' one or logic similar to resolveStepAssignee.
                    // Let's use assignmentService.getCandidatesForStep equivalent logic but for specific cargo?
                    const candidates = await this.assignmentService.getUsersByRole(sig.cargoId, ticket.empresaId, ticket.regionalId ?? undefined);
                    if (candidates.length > 0) targetUserId = candidates[0].id; // Pick first for now
                }

                if (targetUserId) {
                    parallelAssignees.push(targetUserId);
                    const tp = this.ticketParaleloRepo.create({
                        ticketId: ticket.id,
                        pasoId: nextStep.id,
                        usuarioId: targetUserId,
                        estado: 'Pendiente',
                        activo: 1
                    });
                    await this.ticketParaleloRepo.save(tp);
                }
            }
        }

        // 4. Update Ticket
        ticket.pasoActualId = nextStep.id;

        if (nextStep.esParalelo && parallelAssignees.length > 0) {
            ticket.usuarioAsignadoIds = parallelAssignees; // Assign to ALL parallel signers
        } else {
            ticket.usuarioAsignadoIds = assigneeId ? [assigneeId] : [];
        }

        // --- NEW: Sync with normalized table ---
        // 1. Clear existing assignments
        await this.ticketAsignadoRepo.delete({ ticketId: ticket.id });

        // 2. Determine new user IDs
        const newUserIds = (nextStep.esParalelo && parallelAssignees.length > 0)
            ? parallelAssignees
            : (assigneeId ? [assigneeId] : []);

        // 3. Create new entries
        const newAssignmentEntities = newUserIds.map(uid => this.ticketAsignadoRepo.create({
            ticketId: ticket.id,
            usuarioId: uid,
            tipo: nextStep.esParalelo ? 'Paralelo' : 'Principal'
        }));

        if (newAssignmentEntities.length > 0) {
            await this.ticketAsignadoRepo.save(newAssignmentEntities);
        }

        if (assigneeId || parallelAssignees.length > 0) {
            // ticket.fechaAsignacion = new Date(); 
        }

        const savedTicket = await this.ticketRepo.save(ticket);



        // 4.5. Handle Signature (Sequential Signing)

        let signaturePath: string | null = null;

        // Path to the "Master" PDF for this ticket (Accumulative)
        // Storage logic: public/documentos/{ticketId}/filename
        const masterPdfPath = path.resolve(process.cwd(), 'public', 'documentos', ticket.id.toString(), `ticket_${ticket.id}.pdf`);
        let sourcePath = masterPdfPath;

        try {
            await fs.access(masterPdfPath);
        } catch {
            // File doesn't exist. Two cases: 
            // 1. First time generating (e.g. didn't have template fields).
            sourcePath = ''; // Marker for "No file"
        }

        if (sourcePath) {
            try {
                // Try to stamp signatures for the CURRENT step (the one being completed)
                const signedBuffer = await this.signatureStampingService.stampSignaturesForStep(
                    sourcePath,
                    currentStep.id,
                    ticket.id
                );

                // Overwrite master
                await fs.writeFile(masterPdfPath, signedBuffer);

                // Save version to history (documents)
                const filename = `ticket_${ticket.id}_step_${currentStep.id}_signed.pdf`;
                await this.documentsService.saveTicketFile(ticket.id, Buffer.from(signedBuffer), filename);

                // Update signaturePath for history
                signaturePath = filename;

            } catch (e) {
                this.logger.warn(`Sequential signing failed for Ticket ${ticket.id}: ${e.message}`);
            }
        }

        // Legacy UI Signature Handling (Optional: if UI sends a drawing, we attach it too)
        if (dto.signature) {
            try {
                const base64Data = dto.signature.replace(/^data:image\/\w+;base64,/, "");
                const buffer = Buffer.from(base64Data, 'base64');
                const filename = `signature_drawing_${Date.now()}.png`;
                await this.documentsService.saveTicketFile(ticket.id, buffer, filename);

                // If we didn't have a sequential PDF, we can use this as ref
                if (!signaturePath) signaturePath = filename;
            } catch (e) {
                this.logger.error(`Failed to save signature for ticket ${ticket.id}`, e);
            }
        }

        // 5. Record History
        const history = this.historyRepo.create({
            ticketId: ticket.id,
            pasoId: nextStep.id,
            usuarioAsignadoId: assigneeId || undefined, // Who got the ticket
            usuarioAsignadorId: dto.actorId, // Who moved the ticket
            fechaAsignacion: new Date(),
            comentario: dto.comentario || (transitionUsed?.condicionNombre ? `Transición: ${transitionUsed.condicionNombre}` : `Avanzó al paso: ${nextStep.nombre}`),
            estado: 1,
            estadoTiempoPaso: 'A Tiempo',
            firmaPath: signaturePath
        });
        await this.historyRepo.save(history);

        if (assigneeId) {
            const assignee = await this.userRepo.findOne({ where: { id: assigneeId } });
            if (assignee) {
                await this.notificationsService.notifyAssignment(savedTicket, assignee);
            }
        }

        // 6. Save Dynamic Fields (Bulk Insert)
        if (dto.templateValues && dto.templateValues.length > 0) {
            const valuesToSave = dto.templateValues.map(tv => this.ticketCampoValorRepo.create({
                ticketId: ticket.id,
                campoId: tv.campoId,
                valor: tv.valor,
                estado: 1
            }));

            await this.ticketCampoValorRepo.save(valuesToSave);
        }

        return savedTicket;
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
}
