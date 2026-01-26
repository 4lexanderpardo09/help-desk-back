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
import { NotificationsService } from '../../notifications/services/notifications.service';
import { SlaService } from './sla.service';
import { DocumentsService } from '../../documents/services/documents.service';
import { TicketCampoValor } from '../../tickets/entities/ticket-campo-valor.entity';

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
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            getOne: jest.fn(),
        })),
    };

    const mockAssignmentService = {
        resolveJefeInmediato: jest.fn(),
        getCandidatesForStep: jest.fn(),
    };

    const mockNotificationsService = {
        notifyAssignment: jest.fn(),
    };

    const mockSlaService = {
        calculateSla: jest.fn(),
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
                { provide: NotificationsService, useValue: mockNotificationsService },
                { provide: SlaService, useValue: mockSlaService },
                {
                    provide: DocumentsService,
                    useValue: {
                        saveTicketFile: jest.fn(),
                    }
                },
                { provide: getRepositoryToken(TicketCampoValor), useValue: { ...mockRepo } },
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
            const mockCandidate = { id: 88, nombre: 'Agent 88' };

            ticketRepo.findOne.mockResolvedValue(mockTicket);

            // Mock Next Step Query (Linear)
            const queryBuilder = pasoRepo.createQueryBuilder();
            queryBuilder.getOne.mockResolvedValue(mockNextStep);
            jest.spyOn(pasoRepo, 'createQueryBuilder').mockReturnValue(queryBuilder);

            // Mock Assignment: Return one candidate so it auto-assigns
            mockAssignmentService.getCandidatesForStep.mockResolvedValue([mockCandidate]);

            const dto = { ticketId: 1, actorId: 99, transitionKeyOrStepId: 'NEXT' };
            await service.transitionStep(dto);

            expect(ticketRepo.save).toHaveBeenCalledWith(expect.objectContaining({
                pasoActualId: 11,
                usuarioAsignadoIds: [88]
            }));
        });

        it('should assign to creator if configured via getCandidates', async () => {
            const mockTicket = {
                id: 2,
                pasoActual: { id: 10, orden: 1, flujoId: 100 },
                usuarioId: 50
            };
            const mockNextStep = { id: 12, orden: 2, asignarCreador: true };
            const mockCreator = { id: 50, nombre: 'Creator' };

            ticketRepo.findOne.mockResolvedValue(mockTicket);

            const queryBuilder = pasoRepo.createQueryBuilder();
            queryBuilder.getOne.mockResolvedValue(mockNextStep);
            jest.spyOn(pasoRepo, 'createQueryBuilder').mockReturnValue(queryBuilder);

            // Mock assignment service returning creator
            mockAssignmentService.getCandidatesForStep.mockResolvedValue([mockCreator]);

            await service.transitionStep({ ticketId: 2, actorId: 99, transitionKeyOrStepId: 'NEXT' });

            expect(ticketRepo.save).toHaveBeenCalledWith(expect.objectContaining({
                usuarioAsignadoIds: [50]
            }));
        });

        it('should save dynamic template values if provided', async () => {
            const mockTicket = {
                id: 1,
                pasoActual: { id: 10, orden: 1, flujoId: 100 },
                usuarioId: 50
            };
            const mockNextStep = { id: 11, orden: 2 };

            ticketRepo.findOne.mockResolvedValue(mockTicket);

            const queryBuilder = pasoRepo.createQueryBuilder();
            queryBuilder.getOne.mockResolvedValue(mockNextStep);
            jest.spyOn(pasoRepo, 'createQueryBuilder').mockReturnValue(queryBuilder);
            mockAssignmentService.getCandidatesForStep.mockResolvedValue([]);

            const templateValues = [
                { campoId: 101, valor: 'Value 1' },
                { campoId: 102, valor: 'Value 2' }
            ];

            const dto = {
                ticketId: 1,
                actorId: 99,
                transitionKeyOrStepId: 'NEXT',
                templateValues
            };

            // Mock Repo Save
            const ticketCampoValorRepo = module.get(getRepositoryToken(TicketCampoValor));
            ticketCampoValorRepo.create.mockImplementation((dto) => dto);

            await service.transitionStep(dto);

            expect(ticketCampoValorRepo.save).toHaveBeenCalledWith(expect.arrayContaining([
                expect.objectContaining({ ticketId: 1, campoId: 101, valor: 'Value 1' }),
                expect.objectContaining({ ticketId: 1, campoId: 102, valor: 'Value 2' })
            ]));
        });
    });

    describe('checkStartFlow', () => {
        it('should return requiresManualSelection=false for automatic steps', async () => {
            const mockStep = {
                id: 1,
                nombre: 'Auto Step',
                asignarCreador: true,
                pasoFlujoUsuarios: [],
                cargoAsignadoId: null
            };

            // Mock getInitialStep
            jest.spyOn(service, 'getInitialStep').mockResolvedValue(mockStep as any);

            const result = await service.checkStartFlow(1);
            expect(result.requiresManualSelection).toBe(false);
            expect(result.initialStepId).toBe(1);
        });

        it('should return candidates if step has explicit users', async () => {
            const mockStep = {
                id: 2,
                nombre: 'Explicit Step',
                usuarios: [
                    { usuario: { id: 10, nombre: 'A', apellido: 'B', email: 'a@b.com' } }
                ],
                pasoFlujoUsuarios: [] // Legacy prop
            };

            jest.spyOn(service, 'getInitialStep').mockResolvedValue(mockStep as any);

            // Mock Assignment Service to return the user from the step
            mockAssignmentService.getCandidatesForStep.mockResolvedValue([
                { id: 10, nombre: 'A', apellido: 'B', email: 'a@b.com', cargo: { nombre: 'C' } }
            ]);

            const result = await service.checkStartFlow(2);
            // Updated logic: if only 1 candidate, it is auto-assigned (false)
            expect(result.requiresManualSelection).toBe(false);
            expect(result.candidates).toHaveLength(1);
            expect(result.candidates[0].id).toBe(10);
        });
    });

    describe('approveFlow', () => {
        it('should verify approver and transition ticket', async () => {
            const mockTicket = {
                id: 100,
                usuarioJefeAprobadorId: 5,
                pasoActual: { id: 10, orden: 1, flujoId: 1 }
            };

            ticketRepo.findOne.mockResolvedValue(mockTicket);

            // Mock transitionStep implementation or spy
            const transitionSpy = jest.spyOn(service, 'transitionStep').mockResolvedValue(mockTicket as any);

            await service.approveFlow(100, 5);

            expect(transitionSpy).toHaveBeenCalledWith(expect.objectContaining({
                ticketId: 100,
                actorId: 5,
                transitionKeyOrStepId: 'aprobado'
            }));
        });

        it('should fallback to next step if transition key fails', async () => {
            const mockTicket = {
                id: 100,
                usuarioJefeAprobadorId: 5,
                pasoActual: { id: 10, orden: 1, flujoId: 1 }
            };
            const mockNextStep = { id: 20 };

            ticketRepo.findOne.mockResolvedValue(mockTicket);

            // First call fails
            const transitionSpy = jest.spyOn(service, 'transitionStep')
                .mockRejectedValueOnce(new Error('No transition'))
                .mockResolvedValueOnce(mockTicket as any); // Second call succeeds

            // Mock finding next step
            const queryBuilder = pasoRepo.createQueryBuilder();
            queryBuilder.getOne.mockResolvedValue(mockNextStep);
            jest.spyOn(pasoRepo, 'createQueryBuilder').mockReturnValue(queryBuilder);

            await service.approveFlow(100, 5);

            expect(transitionSpy).toHaveBeenCalledTimes(2);
            expect(transitionSpy).toHaveBeenLastCalledWith(expect.objectContaining({
                transitionKeyOrStepId: '20'
            }));
        });
    });
});
