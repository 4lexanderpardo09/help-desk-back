import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { UpdateTicketDto } from '../dto/update-ticket.dto';
import { User } from '../../users/entities/user.entity';

import { AssignmentService } from '../../assignments/assignment.service';

@Injectable()
export class TicketService {
    constructor(
        @InjectRepository(Ticket)
        private readonly ticketRepo: Repository<Ticket>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        private readonly assignmentService: AssignmentService,
    ) { }

    /**
     * Crea un nuevo ticket en el sistema.
     * Orquesta la asignación de empresa, departamento y regional basados en el creador.
     * @param dto Datos iniciales del ticket
     * @returns Ticket creado
     */
    async create(dto: CreateTicketDto): Promise<Ticket> {
        // 1. Get User Info to fill default fields (empresa, departamento, regional)
        const user = await this.userRepo.findOne({
            where: { id: dto.usuarioId },
            relations: ['departamento', 'regional', 'empresas']
        });

        if (!user) throw new NotFoundException(`Usuario ${dto.usuarioId} no encontrado`);

        // 3. Resolve Default Assignee (Jefe Inmediato check)
        let assignedId: number | null = dto.usuarioAsignadoId || null;

        if (!assignedId) {
            const jefeId = await this.assignmentService.resolveJefeInmediato(dto.usuarioId);
            if (jefeId) {
                assignedId = jefeId;
            }
        }

        // 4. Prepare Entity
        const ticket = this.ticketRepo.create({
            ...dto,
            empresaId: user.empresas?.[0]?.id || 1, // Default to first company or 1
            departamentoId: user.departamentoId || 0,
            regionalId: user.regionalId || 0,
            fechaCreacion: new Date(),
            estado: 1, // Abierto
            usuarioAsignadoIds: assignedId ? [assignedId] : []
        });

        // Save Ticket
        const savedTicket = await this.ticketRepo.save(ticket);

        // TODO: Create Assignment History Record (TicketAsignacionHistorico)

        return savedTicket;
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
}
