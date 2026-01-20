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

    // DISABLED TESTS due to missing DB columns
    describe('calculateSlaStatus', () => {
        it('should return "A Tiempo" always (Feature Disabled)', () => {
            expect(service.calculateSlaStatus(new Date(), 5)).toBe('A Tiempo');
        });
    });

    describe('findOverdueTickets', () => {
        it('should return empty array (Feature Disabled)', async () => {
            const result = await service.findOverdueTickets();
            expect(result).toEqual([]);
        });
    });

    describe('processOverdueTicket', () => {
        it('should do nothing (Feature Disabled)', async () => {
            const mockTicket = { id: 1 } as any;
            await service.processOverdueTicket(mockTicket);
            expect(mockHistoryRepo.save).not.toHaveBeenCalled();
        });
    });
});
