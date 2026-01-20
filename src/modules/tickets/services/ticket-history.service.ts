import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketDetalle } from '../entities/ticket-detalle.entity';
import { TicketAsignacionHistorico } from '../entities/ticket-asignacion-historico.entity';
import { TicketTimelineItemDto, TimelineItemType } from '../dto/ticket-timeline.dto';
import { Documento } from '../../documents/entities/documento.entity';

@Injectable()
export class TicketHistoryService {
    constructor(
        @InjectRepository(TicketDetalle)
        private readonly ticketDetalleRepo: Repository<TicketDetalle>,
        @InjectRepository(TicketAsignacionHistorico)
        private readonly ticketAsigRepo: Repository<TicketAsignacionHistorico>,
        @InjectRepository(Documento)
        private readonly documentoRepo: Repository<Documento>
    ) { }

    /**
     * Retrieves the consolidated timeline for a ticket.
     * Merges Log/Comments (TicketDetalle) and Assignments/Events (TicketHistory).
     */
    async getTicketTimeline(ticketId: number): Promise<TicketTimelineItemDto[]> {
        const timeline: TicketTimelineItemDto[] = [];

        // 1. Fetch TicketDetalle (Comments, System Logs stored as text)
        const detalles = await this.ticketDetalleRepo.find({
            where: { ticketId, estado: 1 },
            relations: ['usuario', 'documentos'],
            order: { fechaCreacion: 'DESC' }
        });

        // 2. Fetch Assignments History
        const assignments = await this.ticketAsigRepo.find({
            where: { ticketId }, // History is always preserved, minimal state check
            relations: ['usuarioAsignador', 'usuarioAsignado'],
            order: { fechaAsignacion: 'DESC' }
        });

        // 3. Convert Detalles -> Timeline Items
        for (const det of detalles) {
            const docDtos = det.documentos?.map(doc => ({
                id: doc.id,
                nombre: doc.nombre,
                url: `/public/document_detalle/${doc.nombre}` // Simple static path mapping as per legacy convention
            })) || [];

            timeline.push({
                type: TimelineItemType.COMMENT,
                fecha: det.fechaCreacion,
                actor: {
                    id: det.usuarioId,
                    nombre: det.usuario ? `${det.usuario.nombre} ${det.usuario.apellido || ''}` : 'Unknown'
                },
                descripcion: det.descripcion,
                documentos: docDtos
            });
        }

        // 4. Convert Assignments -> Timeline Items
        for (const asig of assignments) {
            let description = 'Reasignación de ticket';
            if (asig.comentario) description += `: ${asig.comentario}`;

            timeline.push({
                type: TimelineItemType.ASSIGNMENT,
                fecha: asig.fechaAsignacion,
                actor: {
                    id: asig.usuarioAsignadorId || 0, // 0 usually means System or Auto
                    nombre: asig.usuarioAsignador ? `${asig.usuarioAsignador.nombre} ${asig.usuarioAsignador.apellido}` : 'Sistema'
                },
                descripcion: description,
                asignadoA: {
                    id: asig.usuarioAsignadoId,
                    nombre: asig.usuarioAsignado ? `${asig.usuarioAsignado.nombre} ${asig.usuarioAsignado.apellido}` : 'Unknown'
                }
            });
        }

        // 5. Sort DESC by date
        return timeline.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
    }
}
