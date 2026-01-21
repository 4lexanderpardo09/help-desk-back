import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketError } from '../entities/ticket-error.entity';

@Injectable()
export class TicketErrorService {
    constructor(
        @InjectRepository(TicketError)
        private readonly repo: Repository<TicketError>,
    ) { }

    async create(data: Partial<TicketError>, userId: number): Promise<TicketError> {
        const error = this.repo.create({
            ...data,
            usuarioReportaId: userId,
            estado: 1
        });
        return this.repo.save(error);
    }

    async getReceivedErrors(userId: number) {
        return this.repo.find({
            where: { usuarioResponsableId: userId, estado: 1 },
            relations: ['ticket', 'usuarioReporta', 'answer'],
            order: { fechaCreacion: 'DESC' }
        });
    }

    async getReportedErrors(userId: number) {
        return this.repo.find({
            where: { usuarioReportaId: userId, estado: 1 },
            relations: ['ticket', 'usuarioResponsable', 'answer'],
            order: { fechaCreacion: 'DESC' }
        });
    }

    async getStatistics() {
        // Group by ans_type (1=Process, 2=Info, etc from FastAnswer)
        // Need to join with FastAnswer
        return this.repo.createQueryBuilder('te')
            .leftJoin('te.answer', 'fa')
            .select('fa.tipo', 'type')
            .addSelect('COUNT(te.id)', 'count')
            .where('te.estado = 1')
            .groupBy('fa.tipo')
            .getRawMany();
    }
}
