import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TicketStatisticsService } from './ticket-statistics.service';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { TicketAsignacionHistorico } from '../../tickets/entities/ticket-asignacion-historico.entity';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

describe('TicketStatisticsService', () => {
    let service: TicketStatisticsService;
    let mockQueryBuilder: any;

    const mockTicketRepo = {
        createQueryBuilder: jest.fn(() => mockQueryBuilder),
    };

    const mockHistoryRepo = {
        find: jest.fn(),
    };

    const mockUser: JwtPayload = {
        usu_id: 1,
        usu_correo: 'admin@test.com',
        rol_id: 1,
        es_nacional: true,
        reg_id: 1,
        car_id: 1,
        dp_id: 1
    };

    beforeEach(async () => {
        mockQueryBuilder = {
            alias: 't',
            clone: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            addSelect: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getCount: jest.fn().mockResolvedValue(10),
            getRawMany: jest.fn().mockResolvedValue([
                { label: 'Soporte', value: '5', id: 1 },
                { label: 'Ventas', value: '3', id: 2 }
            ]),
        };
        // Mock clone to return a new object with same methods (simplified)
        mockQueryBuilder.clone.mockReturnValue(mockQueryBuilder);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TicketStatisticsService,
                { provide: getRepositoryToken(Ticket), useValue: mockTicketRepo },
                { provide: getRepositoryToken(TicketAsignacionHistorico), useValue: mockHistoryRepo },
            ],
        }).compile();

        service = module.get<TicketStatisticsService>(TicketStatisticsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getDashboardStats', () => {
        it('should return aggregations', async () => {
            const result = await service.getDashboardStats(mockUser, { dateFrom: '2026-01-01' });

            expect(result.openCount).toBe(10);
            expect(result.closedCount).toBe(10);
            expect(result.dataset).toHaveLength(2);
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                't.fechaCreacion >= :dateFrom',
                expect.objectContaining({ dateFrom: '2026-01-01 00:00:00' })
            );
        });

        it('should apply client scope correctly', async () => {
            const clientUser = { ...mockUser, rol_id: 3, usu_id: 99 };
            await service.getDashboardStats(clientUser, {});
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('t.usuarioId = :userId', { userId: 99 });
        });
    });

    describe('getPerformanceMetrics', () => {
        it('should calculate durations', async () => {
            const date1 = new Date('2026-01-01T10:00:00');
            const date2 = new Date('2026-01-01T10:30:00'); // 30 mins later

            mockHistoryRepo.find.mockResolvedValue([
                { id: 1, fechaAsignacion: date1, usuarioAsignado: { nombre: 'A', apellido: 'B' } },
                { id: 2, fechaAsignacion: date2, usuarioAsignado: { nombre: 'X', apellido: 'Y' } }
            ]);

            const metrics = await service.getPerformanceMetrics(100);

            expect(metrics).toHaveLength(2);
            expect(metrics[0].durationMinutes).toBe(30);
            expect(metrics[0].stepName).toBe('Paso 1');
        });
    });
});
