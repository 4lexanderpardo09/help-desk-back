import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PrioritiesService } from './priorities.service';
import { Prioridad } from './entities/prioridad.entity';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ApiQueryHelper } from '../../common/utils/api-query-helper';

describe('PrioritiesService', () => {
    let service: PrioritiesService;
    let repository: Repository<Prioridad>;

    let mockQueryBuilder: any;

    const mockPrioridad: Prioridad = {
        id: 1,
        nombre: 'Alta',
        estado: 1,
        subcategoria: [],
        tickets: [],
    };

    const mockRepository = {
        createQueryBuilder: jest.fn(() => mockQueryBuilder),
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        merge: jest.fn(),
        update: jest.fn(),
    };

    beforeEach(async () => {
        mockQueryBuilder = {
            where: jest.fn().mockReturnThis(),
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([mockPrioridad]),
            getOne: jest.fn().mockResolvedValue(mockPrioridad),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PrioritiesService,
                {
                    provide: getRepositoryToken(Prioridad),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<PrioritiesService>(PrioritiesService);
        repository = module.get<Repository<Prioridad>>(getRepositoryToken(Prioridad));

        // Reset mocks
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('list', () => {
        it('should return an array of priorities', async () => {
            const result = await service.list();
            expect(result).toEqual([mockPrioridad]);
            expect(repository.createQueryBuilder).toHaveBeenCalled();
        });
    });

    describe('show', () => {
        it('should return a priority by id', async () => {
            const result = await service.show(1);
            expect(result).toEqual(mockPrioridad);
        });

        it('should throw NotFoundException if priority not found', async () => {
            mockQueryBuilder.getOne.mockResolvedValueOnce(null);
            await expect(service.show(999)).rejects.toThrow(NotFoundException);
        });
    });

    describe('create', () => {
        it('should create a priority successfully', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            mockRepository.create.mockReturnValue(mockPrioridad);
            mockRepository.save.mockResolvedValue(mockPrioridad);

            const result = await service.create({ nombre: 'Alta' });
            expect(result).toEqual(mockPrioridad);
            expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { nombre: 'Alta' } });
            expect(mockRepository.save).toHaveBeenCalled();
        });

        it('should throw ConflictException if name exists', async () => {
            mockRepository.findOne.mockResolvedValue(mockPrioridad);
            await expect(service.create({ nombre: 'Alta' })).rejects.toThrow(ConflictException);
        });
    });

    describe('update', () => {
        it('should update a priority', async () => {
            jest.spyOn(service, 'show').mockResolvedValue(mockPrioridad);
            mockRepository.save.mockResolvedValue({ ...mockPrioridad, nombre: 'Super Alta' });

            const result = await service.update(1, { nombre: 'Super Alta' });
            expect(result.nombre).toBe('Super Alta');
            expect(mockRepository.merge).toHaveBeenCalled();
            expect(mockRepository.save).toHaveBeenCalled();
        });
    });

    describe('delete', () => {
        it('should soft delete a priority', async () => {
            jest.spyOn(service, 'show').mockResolvedValue(mockPrioridad);
            mockRepository.update.mockResolvedValue({ affected: 1 });

            const result = await service.delete(1);
            expect(result).toEqual({ deleted: true, id: 1 });
            expect(mockRepository.update).toHaveBeenCalledWith(1, { estado: 0 });
        });
    });
});
