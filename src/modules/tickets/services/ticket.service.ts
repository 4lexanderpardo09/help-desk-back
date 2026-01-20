import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { UpdateTicketDto } from '../dto/update-ticket.dto';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class TicketService {
    constructor(
        @InjectRepository(Ticket)
        private readonly ticketRepo: Repository<Ticket>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>
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

        // 2. Prepare Entity
        const ticket = this.ticketRepo.create({
            ...dto,
            empresaId: user.empresas?.[0]?.id || 1, // Default to first company or 1
            departamentoId: user.departamentoId || 0,
            regionalId: user.regionalId || 0,
            fechaCreacion: new Date(),
            estado: 1 // Abierto
        });

        // 3. Initial Flow/Step Logic (Simplified for now - "Start Flow" check referenced in Legacy)
        // Ideally we would call workflowService.getInitialStep(subcategoryId) here.
        // For MVP, we assume ticket is created "Open" and WorkflowEngine handles first transition or initial step set by frontend logic/default.

        return this.ticketRepo.save(ticket);
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
