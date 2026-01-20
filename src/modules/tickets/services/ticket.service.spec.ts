import { Test, TestingModule } from '@nestjs/testing';
import { TicketService } from './ticket.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Ticket } from '../entities/ticket.entity';
import { User } from '../../users/entities/user.entity';
import { WorkflowEngineService } from '../../workflows/services/workflow-engine.service';
import { Repository } from 'typeorm';
import { CreateTicketDto } from '../dto/create-ticket.dto';

describe('TicketService', () => {
    let service: TicketService;
    let ticketRepo: Repository<Ticket>;
    let userRepo: Repository<User>;
    let workflowEngine: WorkflowEngineService;

    const mockTicketRepo = {
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
        merge: jest.fn(),
    };

    const mockUserRepo = {
        findOne: jest.fn(),
    };

    const mockWorkflowEngine = {
        startTicketFlow: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TicketService,
                {
                    provide: getRepositoryToken(Ticket),
                    useValue: mockTicketRepo,
                },
                {
                    provide: getRepositoryToken(User),
                    useValue: mockUserRepo,
                },
                {
                    provide: WorkflowEngineService,
                    useValue: mockWorkflowEngine,
                },
            ],
        }).compile();

        service = module.get<TicketService>(TicketService);
        ticketRepo = module.get<Repository<Ticket>>(getRepositoryToken(Ticket));
        userRepo = module.get<Repository<User>>(getRepositoryToken(User));
        workflowEngine = module.get<WorkflowEngineService>(WorkflowEngineService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a ticket and start workflow flow', async () => {
            const createDto: CreateTicketDto = {
                usuarioId: 1,
                categoriaId: 10,
                subcategoriaId: 20,
                titulo: 'Test Ticket',
                descripcion: 'Testing creation',
                prioridadId: 1,
                empresaId: 1,
                departamentoId: 1,
                regionalId: 1,
                tipoTicketId: 1 // Add explicit field if required by DTO, checking DTO definition later if needed
            } as any;

            const mockUser = { id: 1, empresaId: 1, departamentoId: 2, regionalId: 3, empresas: [{ id: 1 }] };
            const initialTicket = { ...createDto, id: undefined, estado: 1 };
            const savedTicket = { ...initialTicket, id: 100 };
            const finalTicket = { ...savedTicket, pasoActualId: 1, usuarioAsignadoIds: [5] };

            mockUserRepo.findOne.mockResolvedValue(mockUser);
            mockTicketRepo.create.mockReturnValue(initialTicket);
            mockTicketRepo.save.mockResolvedValue(savedTicket);
            mockWorkflowEngine.startTicketFlow.mockResolvedValue(finalTicket);

            const result = await service.create(createDto);

            // 1. Verify User Lookup
            expect(mockUserRepo.findOne).toHaveBeenCalledWith({
                where: { id: createDto.usuarioId },
                relations: ['departamento', 'regional', 'empresas']
            });

            // 2. Verify Ticket Creation with defaults from User
            expect(mockTicketRepo.create).toHaveBeenCalledWith(expect.objectContaining({
                usuarioId: 1,
                empresaId: 1,
                departamentoId: 2,
                regionalId: 3
            }));

            // 3. Verify Save
            expect(mockTicketRepo.save).toHaveBeenCalledWith(initialTicket);

            // 4. Verify Workflow Start
            expect(mockWorkflowEngine.startTicketFlow).toHaveBeenCalledWith(savedTicket);

            // 5. Verify Result
            expect(result).toEqual(finalTicket);
        });
    });
});
