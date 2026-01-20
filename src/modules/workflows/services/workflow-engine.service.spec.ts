import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowEngineService } from './workflow-engine.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { PasoFlujo } from '../entities/paso-flujo.entity';
import { FlujoTransicion } from '../entities/flujo-transicion.entity';
import { Flujo } from '../entities/flujo.entity';
import { TicketAsignacionHistorico } from '../../tickets/entities/ticket-asignacion-historico.entity';
import { User } from '../../users/entities/user.entity';
import { AssignmentService } from '../../assignments/assignment.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('WorkflowEngineService', () => {
    let service: WorkflowEngineService;
    let assignmentService: AssignmentService;
    let pasoRepo: any;
    let ticketRepo: any;
    let module: TestingModule;

    const mockRepo = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        createQueryBuilder: jest.fn(() => ({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            getOne: jest.fn(),
        })),
    };

    const mockAssignmentService = {
        resolveJefeInmediato: jest.fn(),
        resolveRegionalAgent: jest.fn(),
    };

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [
                WorkflowEngineService,
                { provide: getRepositoryToken(Ticket), useValue: { ...mockRepo } },
                { provide: getRepositoryToken(PasoFlujo), useValue: { ...mockRepo } },
                { provide: getRepositoryToken(FlujoTransicion), useValue: { ...mockRepo } },
                { provide: getRepositoryToken(Flujo), useValue: { ...mockRepo } },
                { provide: getRepositoryToken(TicketAsignacionHistorico), useValue: { ...mockRepo } },
                { provide: getRepositoryToken(User), useValue: { ...mockRepo } },
                { provide: AssignmentService, useValue: mockAssignmentService },
            ],
        }).compile();

        service = module.get<WorkflowEngineService>(WorkflowEngineService);
        assignmentService = module.get<AssignmentService>(AssignmentService);
        pasoRepo = module.get(getRepositoryToken(PasoFlujo));
        ticketRepo = module.get(getRepositoryToken(Ticket));
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getInitialStep', () => {
        it('should return the first step of the flow linked to subcategory', async () => {
            const mockFlujo = { id: 100, nombre: 'Flujo Test', subcategoriaId: 5, estado: 1 };
            const mockStep = { id: 1, orden: 1, nombre: 'Inicio' };

            // Mock Flujo Find
            const flujoRepo = module.get(getRepositoryToken(Flujo));
            flujoRepo.findOne.mockResolvedValue(mockFlujo);

            // Mock Paso Query
            const queryBuilder = pasoRepo.createQueryBuilder();
            queryBuilder.getOne.mockResolvedValue(mockStep);
            jest.spyOn(pasoRepo, 'createQueryBuilder').mockReturnValue(queryBuilder);

            const result = await service.getInitialStep(5);
            expect(result).toEqual(mockStep);
        });

        it('should throw NotFound if no flow exists for subcategory', async () => {
            const flujoRepo = module.get(getRepositoryToken(Flujo));
            flujoRepo.findOne.mockResolvedValue(null);

            await expect(service.getInitialStep(99)).rejects.toThrow(NotFoundException);
        });
    });

    describe('transitionStep', () => {
        it('should transition to next linear step if no transition key provided', async () => {
            const mockTicket = {
                id: 1,
                pasoActual: { id: 10, orden: 1, flujoId: 100 },
                usuarioId: 50,
                usuarioAsignadoIds: []
            };

            const mockNextStep = { id: 11, orden: 2, nombre: 'Paso 2', cargoAsignadoId: 5 }; // Requires Agent

            ticketRepo.findOne.mockResolvedValue(mockTicket);

            // Mock Next Step Query (Linear)
            const queryBuilder = pasoRepo.createQueryBuilder();
            queryBuilder.getOne.mockResolvedValue(mockNextStep);
            jest.spyOn(pasoRepo, 'createQueryBuilder').mockReturnValue(queryBuilder);

            // Mock Assignment
            mockAssignmentService.resolveRegionalAgent.mockResolvedValue(88); // Agent ID 88

            const dto = { ticketId: 1, actorId: 99, transitionKeyOrStepId: 'NEXT' };
            await service.transitionStep(dto);

            expect(ticketRepo.save).toHaveBeenCalledWith(expect.objectContaining({
                pasoActualId: 11,
                usuarioAsignadoIds: [88]
            }));
        });

        it('should assign to creator if configured', async () => {
            const mockTicket = {
                id: 2,
                pasoActual: { id: 10, orden: 1, flujoId: 100 },
                usuarioId: 50
            };
            const mockNextStep = { id: 12, orden: 2, asignarCreador: true };

            ticketRepo.findOne.mockResolvedValue(mockTicket);

            const queryBuilder = pasoRepo.createQueryBuilder();
            queryBuilder.getOne.mockResolvedValue(mockNextStep);
            jest.spyOn(pasoRepo, 'createQueryBuilder').mockReturnValue(queryBuilder);

            await service.transitionStep({ ticketId: 2, actorId: 99, transitionKeyOrStepId: 'NEXT' });

            expect(ticketRepo.save).toHaveBeenCalledWith(expect.objectContaining({
                usuarioAsignadoIds: [50]
            }));
        });
    });
});
