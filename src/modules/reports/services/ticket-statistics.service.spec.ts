import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { TicketStatisticsService } from './ticket-statistics.service';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { TicketAsignacionHistorico } from '../../tickets/entities/ticket-asignacion-historico.entity';
import { User } from '../../users/entities/user.entity';
import { Organigrama } from '../../positions/entities/organigrama.entity';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { DashboardFiltersDto } from '../dto/dashboard-filters.dto';

describe('TicketStatisticsService', () => {
    let service: TicketStatisticsService;
    let ticketRepo: Repository<Ticket>;
    let organigramaRepo: Repository<Organigrama>;
    let userRepo: Repository<User>;

    // Helpers to mock QB
    const mockQb = {
        clone: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
        getCount: jest.fn().mockResolvedValue(0),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TicketStatisticsService,
                {
                    provide: getRepositoryToken(Ticket),
                    useValue: {
                        createQueryBuilder: jest.fn(() => mockQb)
                    },
                },
                {
                    provide: getRepositoryToken(TicketAsignacionHistorico),
                    useValue: { find: jest.fn() },
                },
                {
                    provide: getRepositoryToken(Organigrama),
                    useValue: { find: jest.fn() },
                },
                {
                    provide: getRepositoryToken(User),
                    useValue: { find: jest.fn() },
                },
            ],
        }).compile();

        service = module.get<TicketStatisticsService>(TicketStatisticsService);
        ticketRepo = module.get(getRepositoryToken(Ticket));
        organigramaRepo = module.get(getRepositoryToken(Organigrama));
        userRepo = module.get(getRepositoryToken(User));

        jest.clearAllMocks();
        // Reset default mock implementations if needed
        mockQb.getRawMany.mockResolvedValue([]);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getScope (Hierarchy)', () => {
        it('should return "all" for Admin (Rol 1)', async () => {
            const user: JwtPayload = { usu_id: 1, rol_id: 1, car_id: 10 } as any;
            const scope = await service.getScope(user);
            expect(scope).toBe('all');
        });

        it('should return [usu_id] for normal user without subordinates', async () => {
            const user: JwtPayload = { usu_id: 5, rol_id: 2, car_id: 20 } as any; // Agent

            // Mock no subordinates
            (organigramaRepo.find as jest.Mock).mockResolvedValue([]);

            const scope = await service.getScope(user);
            expect(scope).toEqual([5]);
        });

        it('should return list of subordinate IDs + self for Boss', async () => {
            const bossUser: JwtPayload = { usu_id: 10, rol_id: 2, car_id: 100 } as any; // Supervisor/Boss

            // 1. First call: Find subordinates of Boss (Cargo 100) -> Returns Cargo 200
            // 2. Recursive call: Find subordinates of Cargo 200 -> Returns Cargo 300
            // 3. Recursive call: Find subordinates of Cargo 300 -> Returns empty

            (organigramaRepo.find as jest.Mock)
                .mockResolvedValueOnce([{ cargoId: 200 }]) // Level 1
                .mockResolvedValueOnce([{ cargoId: 300 }]) // Level 2
                .mockResolvedValueOnce([]);                // Level 3 (Stop)

            // Mock finding users with those cargo IDs
            (userRepo.find as jest.Mock).mockResolvedValue([
                { id: 21 }, // User with Cargo 200
                { id: 31 }  // User with Cargo 300
            ]);

            const scope = await service.getScope(bossUser);

            // Should contain: Self(10), Sub1(21), Sub2(31)
            expect(scope).toEqual(expect.arrayContaining([10, 21, 31]));
            expect(scope).toHaveLength(3);
        });
    });

    describe('getMedianResponseTime', () => {
        it('should calculate correct median for odd number of durations', async () => {
            const user: JwtPayload = { usu_id: 1, rol_id: 1 } as any;
            // Mock raw result: 10, 20, 100 mins
            mockQb.getRawMany.mockResolvedValue([
                { duration: '10' },
                { duration: '100' },
                { duration: '20' }
            ]);

            const median = await service.getMedianResponseTime(user, {});
            expect(median).toBe(20); // Sorted: 10, 20, 100 -> Mid is 20
        });

        it('should calculate correct median for even number of durations', async () => {
            const user: JwtPayload = { usu_id: 1, rol_id: 1 } as any;
            // Mock raw result: 10, 20, 30, 40
            mockQb.getRawMany.mockResolvedValue([
                { duration: '10' },
                { duration: '40' },
                { duration: '20' },
                { duration: '30' }
            ]);

            const median = await service.getMedianResponseTime(user, {});
            // Sorted: 10, 20, 30, 40. Mid indices are 20 and 30. Avg = 25.
            expect(median).toBe(25);
        });

        it('should return 0 if no closed tickets found', async () => {
            const user: JwtPayload = { usu_id: 1, rol_id: 1 } as any;
            mockQb.getRawMany.mockResolvedValue([]);
            const median = await service.getMedianResponseTime(user, {});
            expect(median).toBe(0);
        });
    });
});
