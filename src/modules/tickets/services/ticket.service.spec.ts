import { Test, TestingModule } from '@nestjs/testing';
import { TicketService } from './ticket.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Ticket } from '../entities/ticket.entity';
import { User } from '../../users/entities/user.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

const mockTicketRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    merge: jest.fn(),
};
const mockUserRepo = {
    findOne: jest.fn(),
};

describe('TicketService', () => {
    let service: TicketService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TicketService,
                { provide: getRepositoryToken(Ticket), useValue: mockTicketRepo },
                { provide: getRepositoryToken(User), useValue: mockUserRepo },
            ],
        }).compile();

        service = module.get<TicketService>(TicketService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a ticket successfully', async () => {
            const dto = { usuarioId: 1, categoriaId: 2, titulo: 'Test', descripcion: 'Desc' };
            const mockUser = { id: 1, departamentoId: 10, regionalId: 20, empresas: [{ id: 5 }] };

            mockUserRepo.findOne.mockResolvedValue(mockUser);
            mockTicketRepo.create.mockReturnValue({ ...dto, id: 100 });
            mockTicketRepo.save.mockResolvedValue({ ...dto, id: 100 });

            const result = await service.create(dto as any);
            expect(result).toHaveProperty('id', 100);
            expect(mockTicketRepo.create).toHaveBeenCalledWith(expect.objectContaining({
                empresaId: 5,
                departamentoId: 10
            }));
        });

        it('should throw NotFoundException if user not found', async () => {
            mockUserRepo.findOne.mockResolvedValue(null);
            await expect(service.create({ usuarioId: 99 } as any)).rejects.toThrow(NotFoundException);
        });
    });
});
