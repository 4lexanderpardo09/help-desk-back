import { Test, TestingModule } from '@nestjs/testing';
import { TicketService } from './ticket.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Ticket } from '../entities/ticket.entity';
import { User } from '../../users/entities/user.entity';
import { WorkflowEngineService } from '../../workflows/services/workflow-engine.service';
import { Repository } from 'typeorm';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { TemplatesService } from '../../templates/services/templates.service';
import { PdfStampingService } from '../../templates/services/pdf-stamping.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { DocumentsService } from '../../documents/services/documents.service';
import { TicketCampoValor } from '../entities/ticket-campo-valor.entity';
import { TicketAsignado } from '../entities/ticket-asignado.entity';
import { TicketParalelo } from '../entities/ticket-paralelo.entity';
import { TicketAsignacionHistorico } from '../entities/ticket-asignacion-historico.entity';
import { ErrorType, ErrorTypeCategory } from '../../error-types/entities/error-type.entity';

describe('TicketService', () => {
    let service: TicketService;
    let ticketRepo: Repository<Ticket>;
    let ticketAsigRepo: Repository<TicketAsignacionHistorico>;
    let errorTypeRepo: Repository<ErrorType>;

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

    const mockTicketAsigRepo = {
        create: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
    };

    const mockErrorTypeRepo = {
        findOne: jest.fn(),
    };

    const mockGenericRepo = {
        create: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
    };

    const mockService = {
        // Generic mock for other services
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TicketService,
                { provide: getRepositoryToken(Ticket), useValue: mockTicketRepo },
                { provide: getRepositoryToken(User), useValue: mockUserRepo },
                { provide: WorkflowEngineService, useValue: mockWorkflowEngine },
                { provide: TemplatesService, useValue: mockService },
                { provide: PdfStampingService, useValue: mockService },
                { provide: NotificationsService, useValue: mockService },
                { provide: DocumentsService, useValue: mockService },
                { provide: getRepositoryToken(TicketCampoValor), useValue: mockGenericRepo },
                { provide: getRepositoryToken(TicketAsignado), useValue: mockGenericRepo },
                { provide: getRepositoryToken(TicketParalelo), useValue: mockGenericRepo },
                { provide: getRepositoryToken(TicketAsignacionHistorico), useValue: mockTicketAsigRepo },
                { provide: getRepositoryToken(ErrorType), useValue: mockErrorTypeRepo },
            ],
        }).compile();

        service = module.get<TicketService>(TicketService);
        ticketRepo = module.get<Repository<Ticket>>(getRepositoryToken(Ticket));
        ticketAsigRepo = module.get<Repository<TicketAsignacionHistorico>>(getRepositoryToken(TicketAsignacionHistorico));
        errorTypeRepo = module.get<Repository<ErrorType>>(getRepositoryToken(ErrorType));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('registerErrorEvent', () => {
        const ticketId = 100;
        const userId = 5; // Reporting User
        const creatorId = 99;
        const dto = { errorTypeId: 1, description: 'Test Error' };

        const mockTicket = {
            id: ticketId,
            usuarioId: creatorId,
            pasoActualId: 10,
            usuarioAsignadoIds: [20],
            ticketEstado: 'Abierto',
            estado: 1
        };

        const mockHistory1 = { id: 50, usuarioAsignadoId: 20, pasoId: 10 }; // Current
        const mockHistory2 = { id: 49, usuarioAsignadoId: 30, pasoId: 9 }; // Previous

        it('should handle INFO Error: attribute to previous user but DO NOT move ticket', async () => {
            const infoError = { id: 1, category: ErrorTypeCategory.INFO, title: 'Info Error' };

            mockTicketRepo.findOne.mockResolvedValue(mockTicket);
            mockErrorTypeRepo.findOne.mockResolvedValue(infoError);
            mockTicketAsigRepo.find.mockResolvedValue([mockHistory1, mockHistory2]); // Return 2 records
            mockTicketAsigRepo.create.mockImplementation((dto) => dto);
            mockTicketAsigRepo.save.mockResolvedValue({});

            await service.registerErrorEvent(ticketId, userId, dto);

            // 1. Verify Error History Creation
            // Should be attributed to Previous User (30) from mockHistory2
            expect(mockTicketAsigRepo.create).toHaveBeenCalledWith(expect.objectContaining({
                usuarioAsignadoId: 30, // Attributed to Previous
                estado: 1,
                errorCodeId: 1
            }));

            // 2. Verify Ticket Save (Should NOT be called for movement)
            expect(mockTicketRepo.save).not.toHaveBeenCalled();
        });

        it('should handle PROCESS Error: attribute to previous user AND return ticket', async () => {
            const processError = { id: 2, category: ErrorTypeCategory.PROCESS_ERROR, title: 'Process Error' };

            mockTicketRepo.findOne.mockResolvedValue(mockTicket);
            mockErrorTypeRepo.findOne.mockResolvedValue(processError);
            mockTicketAsigRepo.find.mockResolvedValue([mockHistory1, mockHistory2]);
            mockTicketAsigRepo.create.mockImplementation((dto) => dto);
            mockTicketAsigRepo.save.mockResolvedValue({});
            mockTicketRepo.save.mockResolvedValue({});

            await service.registerErrorEvent(ticketId, userId, dto);

            // 1. Verify Error History Creation (Attributed to 30)
            expect(mockTicketAsigRepo.create).toHaveBeenCalledWith(expect.objectContaining({
                usuarioAsignadoId: 30,
                errorCodeId: 1
            }));

            // 2. Verify Ticket Update (Return to 30)
            expect(mockTicketRepo.save).toHaveBeenCalledWith(expect.objectContaining({
                usuarioAsignadoIds: [30],
                pasoActualId: 9
            }));

            // 3. Verify Return History Creation
            // We expect a SECOND call to create/save for the return action
            expect(mockTicketAsigRepo.create).toHaveBeenCalledWith(expect.objectContaining({
                usuarioAsignadoId: 30,
                comentario: expect.stringContaining('Devuelto por Process Error')
            }));
        });

        it('should handle PROCESS Error (Creator): Closes ticket if previous user is creator', async () => {
            const processError = { id: 2, category: ErrorTypeCategory.PROCESS_ERROR, title: 'Process Error' };
            const mockHistoryCreator = { id: 49, usuarioAsignadoId: creatorId, pasoId: 1 }; // Previous is CREATOR

            mockTicketRepo.findOne.mockResolvedValue(mockTicket);
            mockErrorTypeRepo.findOne.mockResolvedValue(processError);
            mockTicketAsigRepo.find.mockResolvedValue([mockHistory1, mockHistoryCreator]);
            mockTicketAsigRepo.create.mockImplementation((dto) => dto);
            mockTicketAsigRepo.save.mockResolvedValue({});
            mockTicketRepo.save.mockResolvedValue({});

            await service.registerErrorEvent(ticketId, userId, dto);

            // 1. Verify Ticket Closure
            expect(mockTicketRepo.save).toHaveBeenCalledWith(expect.objectContaining({
                ticketEstado: 'Cerrado',
                estado: 2,
                errorProceso: 1
            }));

            // 2. Verify Close History
            expect(mockTicketAsigRepo.create).toHaveBeenCalledWith(expect.objectContaining({
                estado: 2,
                comentario: 'Ticket cerrado por Error de Proceso (Devuelto al creador)'
            }));
        });

        it('should warn if previous assignment not found', async () => {
            const processError = { id: 2, category: ErrorTypeCategory.PROCESS_ERROR, title: 'Process Error' };

            mockTicketRepo.findOne.mockResolvedValue(mockTicket);
            mockErrorTypeRepo.findOne.mockResolvedValue(processError);
            mockTicketAsigRepo.find.mockResolvedValue([mockHistory1]); // Only 1 record (Current)
            mockTicketAsigRepo.create.mockImplementation((dto) => dto);
            mockTicketAsigRepo.save.mockResolvedValue({});

            await service.registerErrorEvent(ticketId, userId, dto);

            // Defaults to current assignee if no previous found
            expect(mockTicketAsigRepo.create).toHaveBeenCalledWith(expect.objectContaining({
                usuarioAsignadoId: 20 // Current
            }));

            // Should not save ticket (no return possible)
            expect(mockTicketRepo.save).not.toHaveBeenCalled();
        });
    });
});
