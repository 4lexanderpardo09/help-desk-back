import { Test, TestingModule } from '@nestjs/testing';
import { TicketErrorService } from './ticket-error.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TicketError } from '../entities/ticket-error.entity';
import { Repository } from 'typeorm';

const mockTicketErrorRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
    })),
};

describe('TicketErrorService', () => {
    let service: TicketErrorService;
    let repo: Repository<TicketError>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TicketErrorService,
                {
                    provide: getRepositoryToken(TicketError),
                    useValue: mockTicketErrorRepo,
                },
            ],
        }).compile();

        service = module.get<TicketErrorService>(TicketErrorService);
        repo = module.get<Repository<TicketError>>(getRepositoryToken(TicketError));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should create an error', async () => {
        const dto = { ticketId: 1, descripcion: 'Error test' };
        const userId = 99;
        const savedError = { id: 1, ticketId: 1, usuarioReportaId: 99, estado: 1 };

        mockTicketErrorRepo.create.mockReturnValue(savedError);
        mockTicketErrorRepo.save.mockResolvedValue(savedError);

        const result = await service.create(dto, userId);

        expect(mockTicketErrorRepo.create).toHaveBeenCalledWith({
            ...dto,
            usuarioReportaId: userId,
            estado: 1
        });
        expect(mockTicketErrorRepo.save).toHaveBeenCalledWith(savedError);
        expect(result).toEqual(savedError);
    });

    it('should get received errors', async () => {
        const userId = 2;
        mockTicketErrorRepo.find.mockResolvedValue([]);

        await service.getReceivedErrors(userId);

        expect(mockTicketErrorRepo.find).toHaveBeenCalledWith({
            where: { usuarioResponsableId: userId, estado: 1 },
            relations: ['ticket', 'usuarioReporta', 'answer'],
            order: { fechaCreacion: 'DESC' }
        });
    });

    it('should get stats', async () => {
        await service.getStatistics();
        expect(mockTicketErrorRepo.createQueryBuilder).toHaveBeenCalled();
    });
});
