import { Test, TestingModule } from '@nestjs/testing';
import { SlaService } from './sla.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { TicketAsignacionHistorico } from '../../tickets/entities/ticket-asignacion-historico.entity';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { Repository } from 'typeorm';

describe('SlaService', () => {
    let service: SlaService;
    let ticketRepo: Repository<Ticket>;
    let historyRepo: Repository<TicketAsignacionHistorico>;
    let notificationsService: NotificationsService;

    const mockTicketRepo = {
        find: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
    };

    const mockHistoryRepo = {
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
    };

    const mockNotificationsService = {
        getGateway: jest.fn().mockReturnValue({
            emitToUser: jest.fn(),
        }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SlaService,
                {
                    provide: getRepositoryToken(Ticket),
                    useValue: mockTicketRepo,
                },
                {
                    provide: getRepositoryToken(TicketAsignacionHistorico),
                    useValue: mockHistoryRepo,
                },
                {
                    provide: NotificationsService,
                    useValue: mockNotificationsService,
                },
            ],
        }).compile();

        service = module.get<SlaService>(SlaService);
        ticketRepo = module.get(getRepositoryToken(Ticket));
        historyRepo = module.get(getRepositoryToken(TicketAsignacionHistorico));
        notificationsService = module.get(NotificationsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('calculateSlaStatus', () => {
        it('should return "A Tiempo" if startDate is missing', () => {
            expect(service.calculateSlaStatus(null as any, 24)).toBe('A Tiempo');
        });

        it('should return "A Tiempo" if time elapsed is less than SLA', () => {
            const now = new Date();
            const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
            // SLA is 5 hours, elapsed 2 hours -> On Time
            expect(service.calculateSlaStatus(twoHoursAgo, 5)).toBe('A Tiempo');
        });

        it('should return "Atrasado" if time elapsed is greater than SLA', () => {
            const now = new Date();
            const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
            // SLA is 5 hours, elapsed 6 hours -> Late
            expect(service.calculateSlaStatus(sixHoursAgo, 5)).toBe('Atrasado');
        });
    });

    describe('findOverdueTickets', () => {
        it('should identify overdue tickets correctly', async () => {
            const now = new Date();
            const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

            const mockTicket = {
                id: 1,
                pasoActualId: 1,
                pasoActual: { id: 1, horasSla: 5 },
                estado: 1,
            } as any;

            mockTicketRepo.find.mockResolvedValue([mockTicket]);

            mockHistoryRepo.findOne.mockResolvedValue({
                ticketId: 1,
                pasoId: 1,
                fechaAsignacion: sixHoursAgo, // 6 hours ago
                slaStatus: 'A Tiempo', // Currently marked as A Tiempo
            });

            const result = await service.findOverdueTickets();

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe(1);
        });

        it('should skip tickets already marked as Atrasado', async () => {
            const now = new Date();
            const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

            const mockTicket = {
                id: 1,
                pasoActualId: 1,
                pasoActual: { id: 1, horasSla: 5 },
            } as any;

            mockTicketRepo.find.mockResolvedValue([mockTicket]);

            mockHistoryRepo.findOne.mockResolvedValue({
                ticketId: 1,
                pasoId: 1,
                fechaAsignacion: sixHoursAgo,
                slaStatus: 'Atrasado', // Already marked
            });

            const result = await service.findOverdueTickets();

            expect(result).toHaveLength(0);
        });
    });

    describe('processOverdueTicket', () => {
        it('should update history status to Atrasado', async () => {
            const mockTicket = {
                id: 1,
                pasoActualId: 1,
                pasoActual: { id: 1, nombre: 'Pass 1', usuarioEscaladoId: null },
            } as any;

            const mockHistory = {
                ticketId: 1,
                pasoId: 1,
                slaStatus: 'A Tiempo',
                save: jest.fn(),
            };

            mockHistoryRepo.findOne.mockResolvedValue(mockHistory);
            mockHistoryRepo.save.mockResolvedValue(mockHistory);

            await service.processOverdueTicket(mockTicket);

            expect(mockHistoryRepo.save).toHaveBeenCalledWith(expect.objectContaining({
                slaStatus: 'Atrasado',
                estadoTiempoPaso: 'Vencido'
            }));
        });

        it('should NOT reassign but notify assignees when overdue', async () => {
            const mockTicket = {
                id: 1,
                pasoActualId: 1,
                pasoActual: { id: 1, nombre: 'Pass 1', usuarioEscaladoId: 99 },
                usuarioAsignadoIds: [5, 10], // Two current assignees
                titulo: 'Test Ticket'
            } as any;

            const mockHistory = {
                ticketId: 1,
                pasoId: 1,
                slaStatus: 'A Tiempo',
                save: jest.fn(),
            };

            mockHistoryRepo.findOne.mockResolvedValue(mockHistory); // Found existing history

            await service.processOverdueTicket(mockTicket);

            // 1. Should NOT change assignee (save ticket not called for assignment)
            expect(mockTicketRepo.save).not.toHaveBeenCalled();

            // 2. Should notify current users about delay
            const gateway = mockNotificationsService.getGateway();
            expect(gateway.emitToUser).toHaveBeenCalledWith(5, 'ticket_overdue', expect.any(Object));
            expect(gateway.emitToUser).toHaveBeenCalledWith(10, 'ticket_overdue', expect.any(Object));
        });
    });
});
