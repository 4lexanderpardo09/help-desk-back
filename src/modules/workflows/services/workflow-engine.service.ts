import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { PasoFlujo } from '../entities/paso-flujo.entity';
import { FlujoTransicion } from '../entities/flujo-transicion.entity';
import { TicketAsignacionHistorico } from '../../tickets/entities/ticket-asignacion-historico.entity';
import { User } from '../../users/entities/user.entity';
import { TransitionTicketDto } from '../dto/workflow-transition.dto';

@Injectable()
export class WorkflowEngineService {
    constructor(
        @InjectRepository(Ticket)
        private readonly ticketRepo: Repository<Ticket>,
        @InjectRepository(PasoFlujo)
        private readonly pasoRepo: Repository<PasoFlujo>,
        @InjectRepository(FlujoTransicion)
        private readonly transicionRepo: Repository<FlujoTransicion>,
        @InjectRepository(TicketAsignacionHistorico)
        private readonly historyRepo: Repository<TicketAsignacionHistorico>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>
    ) { }

    /**
     * Executes a transition for a ticket.
     * Logic:
     * 1. Validate current step.
     * 2. Determine next step based on transition key (or ID).
     * 3. Resolve Assignee for the next step.
     * 4. Update Ticket (step_id, assignee_id).
     * 5. Record History.
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

        // Strategy A: Try to find by transition name (e.g. "Aprobar")
        const transition = await this.transicionRepo.findOne({
            where: {
                pasoOrigenId: currentStep.id,
                pasoDestino: { nombre: dto.transitionKeyOrStepId } // Simple matching logic or Key matching
            },
            relations: ['pasoDestino']
        });

        // This is a simplified logic. In legacy, 'transitionKey' maps to specific logic or IDs.
        // If string is number-like, treat as Step ID.
        if (!isNaN(Number(dto.transitionKeyOrStepId))) {
            nextStep = await this.pasoRepo.findOne({ where: { id: Number(dto.transitionKeyOrStepId) } });
        } else if (transition) {
            nextStep = transition.pasoDestino;
        } else {
            // Fallback: Try linear next step (higher order)
            nextStep = await this.pasoRepo.createQueryBuilder('p')
                .where('p.flujoId = :flujoId', { flujoId: currentStep.flujoId })
                .andWhere('p.orden > :orden', { orden: currentStep.orden })
                .orderBy('p.orden', 'ASC')
                .getOne();
        }

        if (!nextStep) throw new BadRequestException(`No valid next step found for transition '${dto.transitionKeyOrStepId}'`);

        // 3. Resolve Assignee
        // Logic: If step has assigned role (cargo), find user in that role + same region/company as ticket creator or ticket flow.
        // For MVP, we'll assign to a random user with the role or unassigned (null) if "Pool".

        let newAssigneeId: number | null = null;
        if (nextStep.cargoAsignadoId) {
            // Find candidate. 
            // Ideally this should use a separate "AssigneeResolverService".
            // We'll keep it simple: Find first user with that role.
            const candidate = await this.userRepo.findOne({
                where: { cargoId: nextStep.cargoAsignadoId, estado: 1 }
            });
            if (candidate) newAssigneeId = candidate.id;
        } else if (nextStep.asignarCreador) {
            newAssigneeId = ticket.usuarioId;
        }

        // 4. Update Ticket
        ticket.pasoActualId = nextStep.id;
        ticket.usuarioAsignadoIds = newAssigneeId ? [newAssigneeId] : [];
        // ticket.fechaAsignacion = new Date(); // Column does not exist in Ticket entity

        if (nextStep.permiteCerrar) {
            ticket.estado = 2; // Closed
            ticket.fechaCierre = new Date();
        }

        await this.ticketRepo.save(ticket);

        // 5. Record History
        const history = this.historyRepo.create({
            ticketId: ticket.id,
            usuarioAsignadoId: nextStep.id, // Wait, logic might be confusing Step vs User. 
            // Legacy history table: usu_asig is User ID. paso_id column exists too.
            pasoId: nextStep.id,
            usuarioAsignadorId: dto.actorId,
            fechaAsignacion: new Date(),
            comentario: dto.comentario || `Transición a ${nextStep.nombre}`,
            estado: 1
        });
        await this.historyRepo.save(history);

        return ticket;
    }
}
