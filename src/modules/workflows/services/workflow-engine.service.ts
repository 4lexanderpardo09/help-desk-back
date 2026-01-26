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

        // If explicitly > 1 candidate, or it's a Role assignment (which we treat as manual selection usually)
        // logic:
        const isRoleAssignment = !!step.cargoAsignadoId; // Role implies selection pool
        const requiresManual = isRoleAssignment || candidateDtos.length > 1;

        return {
            requiresManualSelection: requiresManual,
            candidates: candidateDtos,
            initialStepId: step.id,
            initialStepName: step.nombre
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
            }
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

        // 2. Determine Next Step
        // Use Unified Resolver
        const { nextStep, transitionUsed } = await this.resolveNextStep(currentStep, dto.transitionKeyOrStepId);

        // Note: Strategies A, B, C are now inside resolveNextStep

        if (!nextStep) throw new BadRequestException(`No se encontró un paso siguiente válido.`);

        // 3. Resolve Assignee (The core complexity)
        // If transitioning manually, we typically don't pass manualAssigneeId unless the DTO supports it.
        // For now, rely on auto-resolution.
        const assigneeId = await this.resolveStepAssignee(nextStep, ticket);

        // 4. Update Ticket
        ticket.pasoActualId = nextStep.id;
        ticket.usuarioAsignadoIds = assigneeId ? [assigneeId] : [];
        if (assigneeId) {
            // ticket.fechaAsignacion = new Date(); // If column existed
        }

        if (nextStep.permiteCerrar && nextStep.cerrarTicketObligatorio) {
            ticket.estado = 2; // Closed
            ticket.fechaCierre = new Date();
        }

        const savedTicket = await this.ticketRepo.save(ticket);



        // 4.5. Handle Signature
        let signaturePath: string | null = null;
        if (dto.signature) {
            try {
                // Remove prefix if present
                const base64Data = dto.signature.replace(/^data:image\/\w+;base64,/, "");
                const buffer = Buffer.from(base64Data, 'base64');
                // Use distinct filename
                const filename = `signature_transition_${Date.now()}.png`;

                await this.documentsService.saveTicketFile(ticket.id, buffer, filename);
                // Store path relative to documents root or just filename as known convention
                signaturePath = `${filename}`;
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
