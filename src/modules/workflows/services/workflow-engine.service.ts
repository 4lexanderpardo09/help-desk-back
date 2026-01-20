import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class WorkflowEngineService {
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
     * @returns The updated ticket entity with `pasoActual` populated.
     */
    async startTicketFlow(ticket: Ticket): Promise<Ticket> {
        if (!ticket.subcategoriaId) {
            throw new BadRequestException('El ticket debe tener una subcategoría para iniciar un flujo.');
        }

        // 1. Get Initial Step
        const initialStep = await this.getInitialStep(ticket.subcategoriaId);

        // 2. Resolve Assignee
        const assigneeId = await this.resolveStepAssignee(initialStep, ticket);

        // 3. Update Ticket
        ticket.pasoActualId = initialStep.id;
        ticket.usuarioAsignadoIds = assigneeId ? [assigneeId] : [];
        if (assigneeId) {
            // ticket.fechaAsignacion = new Date();
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
            estado: 1
        });
        await this.historyRepo.save(history);

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

        // 5. Record History
        const history = this.historyRepo.create({
            ticketId: ticket.id,
            pasoId: nextStep.id,
            usuarioAsignadoId: assigneeId || undefined, // Who got the ticket
            usuarioAsignadorId: dto.actorId, // Who moved the ticket
            fechaAsignacion: new Date(),
            comentario: dto.comentario || (transitionUsed?.condicionNombre ? `Transición: ${transitionUsed.condicionNombre}` : `Avanzó al paso: ${nextStep.nombre}`),
            estado: 1
        });
        await this.historyRepo.save(history);

        return savedTicket;
    }

    /**
     * Resolves the user ID that should be assigned to the ticket in a specific step.
     * 
     * Resolution Priority:
     * 1. **Assign to Creator**: If `step.asignarCreador` is true.
     * 2. **Immediate Boss**: If `step.necesitaAprobacionJefe` is true.
     * 3. **Role & Region**: If `step.cargoAsignadoId` is set, finds a user with that Role in the Ticket Creator's Region.
     * 
     * @param step - The destination step entity.
     * @param ticket - The ticket being processed (needed for creator context).
     * @returns The User ID of the assignee, or `null` if unassigned (pool).
     */
    private async resolveStepAssignee(step: PasoFlujo, ticket: Ticket): Promise<number | null> {
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
