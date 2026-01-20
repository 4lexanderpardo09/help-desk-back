import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowEngineService } from './workflow-engine.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { PasoFlujo } from '../entities/paso-flujo.entity';
import { FlujoTransicion } from '../entities/flujo-transicion.entity';
import { TicketAsignacionHistorico } from '../../tickets/entities/ticket-asignacion-historico.entity';
import { User } from '../../users/entities/user.entity';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const mockTicketRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
};
const mockPasoRepo = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
    })),
};
const mockTransicionRepo = {
    findOne: jest.fn(),
};
const mockHistoryRepo = {
    create: jest.fn(),
    save: jest.fn(),
};
const mockUserRepo = {
    findOne: jest.fn(),
};

describe('WorkflowEngineService', () => {
    let service: WorkflowEngineService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WorkflowEngineService,
                { provide: getRepositoryToken(Ticket), useValue: mockTicketRepo },
                { provide: getRepositoryToken(PasoFlujo), useValue: mockPasoRepo },
                { provide: getRepositoryToken(FlujoTransicion), useValue: mockTransicionRepo },
                { provide: getRepositoryToken(TicketAsignacionHistorico), useValue: mockHistoryRepo },
                { provide: getRepositoryToken(User), useValue: mockUserRepo },
            ],
        }).compile();

        service = module.get<WorkflowEngineService>(WorkflowEngineService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('transitionStep', () => {
        const dto = { ticketId: 1, transitionKeyOrStepId: 'Aprobar', actorId: 99 };
        const mockTicket = { id: 1, pasoActual: { id: 10, flujoId: 1, orden: 1 }, usuarioId: 5 };
        const mockNextStep = { id: 20, nombre: 'Aprobado', cargoAsignadoId: null, asignarCreador: false, permiteCerrar: false };

        it('should throw NotFoundException if ticket not found', async () => {
            mockTicketRepo.findOne.mockResolvedValue(null);
            await expect(service.transitionStep(dto)).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if ticket has no current step', async () => {
            mockTicketRepo.findOne.mockResolvedValue({ ...mockTicket, pasoActual: null });
            await expect(service.transitionStep(dto)).rejects.toThrow(BadRequestException);
        });

        it('should transition to next step based on transition key', async () => {
            mockTicketRepo.findOne.mockResolvedValue(mockTicket);
            mockTransicionRepo.findOne.mockResolvedValue({ pasoDestino: mockNextStep });
            mockHistoryRepo.create.mockReturnValue({});
            mockHistoryRepo.save.mockResolvedValue({});
            mockTicketRepo.save.mockResolvedValue({});

            await service.transitionStep(dto);

            expect(mockTicketRepo.save).toHaveBeenCalledWith(expect.objectContaining({
                pasoActualId: 20
            }));
            expect(mockHistoryRepo.save).toHaveBeenCalled();
        });
    });
});
