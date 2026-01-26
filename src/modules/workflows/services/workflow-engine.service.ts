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

        // Auto-assign logic check
        if (step.asignarCreador || step.necesitaAprobacionJefe || step.campoReferenciaJefeId === -1) {
            // Fully automatic
            return {
                requiresManualSelection: false,
                candidates: [],
                initialStepId: step.id,
                initialStepName: step.nombre
            };
        }

        // If specific users are configured in `usuarios` (mapped via PasoFlujoUsuario)
        const candidates: UserCandidateDto[] = step.usuarios
            .filter(pfu => pfu.usuario) // Filter out incomplete relations
            .map(pfu => ({
                id: pfu.usuario.id,
                nombre: pfu.usuario.nombre || '',
                apellido: pfu.usuario.apellido || '',
                email: pfu.usuario.email,
                cargo: pfu.usuario.cargo?.nombre
            }));

        // Only return here if we actually found valid candidates
        if (candidates.length > 0) {
            return {
                requiresManualSelection: true,
                candidates,
                initialStepId: step.id,
                initialStepName: step.nombre
            };
        }
        // If candidates is empty (e.g. all relations broken), fall through to Role checks

        // If Cargo is configured but NOT Approval (which implies Boss), it implies a Pool or Manual Pick from Role
        if (step.cargoAsignadoId) {
            // Need to return users with this Role (and maybe restricted by Region?)
            // For checking start flow, we don't have the creator's region easily available unless we pass userId.
            // But let's assume we return all users with that role for now.
            const users = await this.userRepo.find({
                where: { cargoId: step.cargoAsignadoId, estado: 1 },
                select: ['id', 'nombre', 'apellido', 'email', 'cargo']
            });

            const candidates: UserCandidateDto[] = users.map(u => ({
                id: u.id,
                nombre: u.nombre || '',
                apellido: u.apellido || '',
                email: u.email,
                cargo: u.cargo?.nombre
            }));

            return {
                requiresManualSelection: true,
                candidates,
                initialStepId: step.id,
                initialStepName: step.nombre
            };
        }

        // Fallback: No specific assignment rule -> Auto assign to pool? 
        // For now, return false.
        return {
            requiresManualSelection: false,
            candidates: [],
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
    async checkNextStep(ticketId: number): Promise<CheckNextStepResponseDto> {
        const ticket = await this.ticketRepo.findOne({
            where: { id: ticketId },
            relations: ['pasoActual']
        });

        if (!ticket) throw new NotFoundException(`Ticket ${ticketId} not found`);
        const currentStep = ticket.pasoActual;
        if (!currentStep) throw new BadRequestException('Ticket has no current step');

        // Determine Next Step (Strategy C: Linear Sequence)
        // Note: This logic mirrors transitionStep's fallback.
        const nextStep = await this.pasoRepo.createQueryBuilder('p')
            .where('p.flujoId = :flujoId', { flujoId: currentStep.flujoId })
            .andWhere('p.orden > :orden', { orden: currentStep.orden })
            .andWhere('p.estado = 1')
            .orderBy('p.orden', 'ASC')
            .getOne();

        if (!nextStep) {
            // No next step found - End of flow?
            return {
                requiresManualSelection: false,
                candidates: [],
                nextStepId: -1,
                nextStepName: 'Fin del Flujo',
                isFinal: true
            };
        }

        // Logic for Assignment Candidates

        // 1. Assign to Creator
        if (nextStep.asignarCreador) {
            const creator = await this.userRepo.findOne({ where: { id: ticket.usuarioId } });
            const candidates = creator ? [{
                id: creator.id,
                nombre: creator.nombre || '',
                apellido: creator.apellido || '',
                email: creator.email,
                cargo: creator.cargo?.nombre || 'Creador'
            }] : [];

            return {
                requiresManualSelection: false, // Deterministic
                candidates,
                nextStepId: nextStep.id,
                nextStepName: nextStep.nombre,
                isFinal: false
            };
        }

        // 2. Immediate Boss (Approval)
        if (nextStep.necesitaAprobacionJefe || nextStep.campoReferenciaJefeId === -1) {
            const bossId = await this.assignmentService.resolveJefeInmediato(ticket.usuarioId);
            let candidates: UserCandidateDto[] = [];

            if (bossId) {
                const boss = await this.userRepo.findOne({ where: { id: bossId } });
                if (boss) {
                    candidates.push({
                        id: boss.id,
                        nombre: boss.nombre || '',
                        apellido: boss.apellido || '',
                        email: boss.email,
                        cargo: boss.cargo?.nombre || 'Jefe Inmediato'
                    });
                }
            }

            return {
                requiresManualSelection: false, // Deterministic
                candidates,
                nextStepId: nextStep.id,
                nextStepName: nextStep.nombre,
                isFinal: false
            };
        }

        // 3. Role Based (Potential Manual Selection)
        if (nextStep.cargoAsignadoId) {
            // Return all users with this role (filtered by region if possible, but keeping it broad for now like checkStartFlow)
            // Ideally we should filter by ticket creator's region, similar to transitionStep logic
            const user = await this.userRepo.findOne({ where: { id: ticket.usuarioId } });
            const regionalId = user?.regionalId || 1;

            const users = await this.userRepo.find({
                where: { cargoId: nextStep.cargoAsignadoId, estado: 1, regionalId: regionalId }, // Added regional filter for better accuracy
                select: ['id', 'nombre', 'apellido', 'email', 'cargo']
            });

            const candidates: UserCandidateDto[] = users.map(u => ({
                id: u.id,
                nombre: u.nombre || '',
                apellido: u.apellido || '',
                email: u.email,
                cargo: u.cargo?.nombre
            }));

            return {
                requiresManualSelection: true, // Role based usually implies selection or pool
                candidates,
                nextStepId: nextStep.id,
                nextStepName: nextStep.nombre,
                isFinal: false
            };
        }

        // 4. Fallback
        return {
            requiresManualSelection: false,
            candidates: [],
            nextStepId: nextStep.id,
            nextStepName: nextStep.nombre,
            isFinal: false
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
        let nextStep: PasoFlujo | null = null;
        let transitionUsed: FlujoTransicion | null = null;

        // Strategy A: Explicit Transition by Condition Key
        if (dto.transitionKeyOrStepId && isNaN(Number(dto.transitionKeyOrStepId))) {
            const transition = await this.transicionRepo.findOne({
                where: {
                    pasoOrigenId: currentStep.id,
                    condicionClave: dto.transitionKeyOrStepId,
                    estado: 1
                },
                relations: ['pasoDestino']
            });
            if (transition && transition.pasoDestino) {
                nextStep = transition.pasoDestino;
                transitionUsed = transition;
            }
        }

        // Strategy B: Explicit Target Step ID (Admin overrides or simple transitions)
        if (!nextStep && !isNaN(Number(dto.transitionKeyOrStepId))) {
            nextStep = await this.pasoRepo.findOne({ where: { id: Number(dto.transitionKeyOrStepId) } });
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
    private async resolveStepAssignee(step: PasoFlujo, ticket: Ticket, manualAssigneeId?: number): Promise<number | null> {
        // 0. Manual Override
        if (manualAssigneeId) {
            return manualAssigneeId;
        }

        // 1. Assign to Creator?
        if (step.asignarCreador) {
            return ticket.usuarioId;
        }

        // 2. Assign to Immediate Boss? (Approval Flow)
        if (step.necesitaAprobacionJefe || step.campoReferenciaJefeId === -1) {
            return this.assignmentService.resolveJefeInmediato(ticket.usuarioId);
        }

        // 3. Specific Role + Regional Logic
        if (step.cargoAsignadoId) {
            // Use the ticket creator's regional to find the local agent
            const user = await this.userRepo.findOne({ where: { id: ticket.usuarioId } });
            const regionalId = user?.regionalId || 1; // Default to 1 if unknown

            return this.assignmentService.resolveRegionalAgent(step.cargoAsignadoId, regionalId);
        }

        // 4. Round Robin / Pool? (Future impl)

        return null;
    }
}
