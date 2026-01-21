import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketListingService } from './ticket-listing.service';
import { Ticket } from '../entities/ticket.entity';
import { TicketEtiqueta } from '../entities/ticket-etiqueta.entity';
import { User } from '../../users/entities/user.entity';
import { TicketFilterDto, TicketView } from '../dto/ticket-filter.dto';
import { AbilityBuilder, Ability } from '@casl/ability';


describe('TicketListingService', () => {
    let service: TicketListingService;
    let ticketRepo: Repository<Ticket>;
    let userRepo: Repository<User>;

    // Helpers to mock QB
    const mockQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };

    const mockTagQb = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
    };

    const mockAbility = {
        can: jest.fn(),
    } as any;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TicketListingService,
                {
                    provide: getRepositoryToken(Ticket),
                    useValue: { createQueryBuilder: jest.fn(() => mockQb) },
                },
                {
                    provide: getRepositoryToken(TicketEtiqueta),
                    useValue: { createQueryBuilder: jest.fn(() => mockTagQb) },
                },
                {
                    provide: getRepositoryToken(User),
                    useValue: { find: jest.fn().mockResolvedValue([]) },
                },
            ],
        }).compile();

        service = module.get<TicketListingService>(TicketListingService);
        ticketRepo = module.get(getRepositoryToken(Ticket));
        userRepo = module.get(getRepositoryToken(User));

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('list', () => {
        const mockUser = { usu_id: 1, roleId: 2 };

        it('should join ticketErrors when view is ERRORS_REPORTED', async () => {
            const filters: TicketFilterDto = { view: TicketView.ERRORS_REPORTED };
            mockAbility.can.mockReturnValue(true);

            await service.list(mockUser, filters, mockAbility);

            expect(mockQb.innerJoin).toHaveBeenCalledWith(
                't.ticketErrors',
                'te_rep',
                expect.stringContaining('te_rep.usuarioReportaId = :userId'),
                { userId: 1 }
            );
        });

        it('should join ticketErrors when view is ERRORS_RECEIVED', async () => {
            const filters: TicketFilterDto = { view: TicketView.ERRORS_RECEIVED };
            mockAbility.can.mockReturnValue(true);

            await service.list(mockUser, filters, mockAbility);

            expect(mockQb.innerJoin).toHaveBeenCalledWith(
                't.ticketErrors',
                'te_resp',
                expect.stringContaining('te_resp.usuarioResponsableId = :userId'),
                { userId: 1 }
            );
        });

        it('should fetch assignee names if tickets are returned', async () => {
            // Mock tickets with assignee IDs
            const mockTickets = [
                { id: 10, titulo: 'T1', usuarioAsignadoIds: [5] },
                { id: 11, titulo: 'T2', usuarioAsignadoIds: [5, 6] }
            ];
            mockQb.getManyAndCount.mockResolvedValue([mockTickets, 2]);

            // Mock User Repo response
            const mockUsers = [
                { id: 5, nombre: 'Juan', apellido: 'Perez' },
                { id: 6, nombre: 'Ana', apellido: 'Gomez' }
            ];
            (userRepo.find as jest.Mock).mockResolvedValue(mockUsers);

            const result = await service.list(mockUser, { view: TicketView.ALL }, mockAbility);

            expect(userRepo.find).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: expect.any(Object) } // In([5, 6]) matcher is tricky in jest default
            }));

            // Check name resolution
            expect(result.data[0].asignadoNombre).toBe('Juan Perez');
            expect(result.data[1].asignadoNombre).toBe('Juan Perez (+1)');
        });
    });
});
