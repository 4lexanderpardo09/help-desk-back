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
            expect(service.calculateSlaStatus(null as any, 2)).toBe('A Tiempo');
        });

        it('should return "A Tiempo" if elapsed time is less than SLA (1 day)', () => {
            const now = new Date();
            const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
            // SLA is 1 day, elapsed 0.5 days -> On Time
            expect(service.calculateSlaStatus(twelveHoursAgo, 1)).toBe('A Tiempo');
        });

        it('should return "Atrasado" if elapsed time is greater than SLA', () => {
            const now = new Date();
            const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
            // SLA is 1 day, elapsed 2 days -> Late
            expect(service.calculateSlaStatus(twoDaysAgo, 1)).toBe('Atrasado');
        });
    });

    describe('findOverdueTickets', () => {
        it('should identify overdue tickets correctly using tiempoHabil', async () => {
            const now = new Date();
            const threeDaysAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);

            const mockTicket = {
                id: 1,
                pasoActualId: 1,
                pasoActual: { id: 1, tiempoHabil: 2 }, // 2 days SLA
                estado: 1,
            } as any;

            mockTicketRepo.find.mockResolvedValue([mockTicket]);

            mockHistoryRepo.findOne.mockResolvedValue({
                ticketId: 1,
                pasoId: 1,
                fechaAsignacion: threeDaysAgo,
                estadoTiempoPaso: 'A Tiempo',
            });

            const result = await service.findOverdueTickets();

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe(1);
        });

        it('should skip tickets already marked as Vencido', async () => {
            const now = new Date();
            const threeDaysAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);

            const mockTicket = {
                id: 1,
                pasoActualId: 1,
                pasoActual: { id: 1, tiempoHabil: 2 },
            } as any;

            mockTicketRepo.find.mockResolvedValue([mockTicket]);

            mockHistoryRepo.findOne.mockResolvedValue({
                ticketId: 1,
                pasoId: 1,
                fechaAsignacion: threeDaysAgo,
                estadoTiempoPaso: 'Vencido', // Already marked
            });

            const result = await service.findOverdueTickets();

            expect(result).toHaveLength(0);
        });
    });

    describe('processOverdueTicket', () => {
        it('should update history status to Vencido and notify', async () => {
            const mockTicket = {
                id: 1,
                pasoActualId: 1,
                pasoActual: { id: 1, nombre: 'Step 1', tiempoHabil: 2 },
                usuarioAsignadoIds: [5],
                titulo: 'Overdue Ticket'
            } as any;

            const mockHistory = {
                ticketId: 1,
                pasoId: 1,
                estadoTiempoPaso: 'A Tiempo',
                save: jest.fn(),
            };

            mockHistoryRepo.findOne.mockResolvedValue(mockHistory);
            mockHistoryRepo.save.mockResolvedValue(mockHistory);

            await service.processOverdueTicket(mockTicket);

            expect(mockHistoryRepo.save).toHaveBeenCalledWith(expect.objectContaining({
                estadoTiempoPaso: 'Vencido'
            }));

            const gateway = mockNotificationsService.getGateway();
            expect(gateway.emitToUser).toHaveBeenCalledWith(5, 'ticket_overdue', expect.objectContaining({
                ticketId: 1
            }));
        });
    });
});
