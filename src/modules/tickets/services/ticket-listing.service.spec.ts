import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { TicketListingService } from './ticket-listing.service';
import { Ticket } from '../entities/ticket.entity';
import { TicketEtiqueta } from '../entities/ticket-etiqueta.entity';
import { TicketFilterDto } from '../dto/ticket-filter.dto';

describe('TicketListingService', () => {
    let service: TicketListingService;
    let ticketRepository: Repository<Ticket>;
    let ticketEtiquetaRepository: Repository<TicketEtiqueta>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TicketListingService,
                {
                    provide: getRepositoryToken(Ticket),
                    useValue: {
                        createQueryBuilder: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(TicketEtiqueta),
                    useValue: {
                        createQueryBuilder: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<TicketListingService>(TicketListingService);
        ticketRepository = module.get<Repository<Ticket>>(getRepositoryToken(Ticket));
        ticketEtiquetaRepository = module.get<Repository<TicketEtiqueta>>(getRepositoryToken(TicketEtiqueta));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('listTicketsByUser', () => {
        it('should return a list of tickets for a specific user', async () => {
            const qbMock = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
            };

            jest.spyOn(ticketRepository, 'createQueryBuilder').mockReturnValue(qbMock as any);

            const filters: TicketFilterDto = { page: 1, limit: 10 };
            const userId = 1;

            const result = await service.listTicketsByUser(userId, filters);

            expect(ticketRepository.createQueryBuilder).toHaveBeenCalledWith('t');
            expect(qbMock.andWhere).toHaveBeenCalledWith('t.usuarioId = :userId', { userId });
            expect(result).toEqual({ data: [], total: 0, page: 1, limit: 10 });
        });
    });

    // Add more tests for other methods and filter logic
});
