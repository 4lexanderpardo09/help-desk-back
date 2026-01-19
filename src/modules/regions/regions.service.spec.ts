import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RegionsService } from './regions.service';
import { Regional } from './entities/regional.entity';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('RegionsService', () => {
    let service: RegionsService;
    let repository: Repository<Regional>;

    let mockQueryBuilder: any;

    const mockRegional: Regional = {
        id: 1,
        nombre: 'Regional Norte',
        estado: 1,
        zonaId: 1,
        zona: null as any,
        usuarios: [],
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
            getMany: jest.fn().mockResolvedValue([mockRegional]),
            getOne: jest.fn().mockResolvedValue(mockRegional),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RegionsService,
                {
                    provide: getRepositoryToken(Regional),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<RegionsService>(RegionsService);
        repository = module.get<Repository<Regional>>(getRepositoryToken(Regional));

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('list', () => {
        it('should return an array of regionales', async () => {
            const result = await service.list();
            expect(result).toEqual([mockRegional]);
            expect(repository.createQueryBuilder).toHaveBeenCalled();
        });
    });

    describe('show', () => {
        it('should return a regional by id', async () => {
            const result = await service.show(1);
            expect(result).toEqual(mockRegional);
        });

        it('should throw NotFoundException if not found', async () => {
            mockQueryBuilder.getOne.mockResolvedValueOnce(null);
            await expect(service.show(999)).rejects.toThrow(NotFoundException);
        });
    });

    describe('create', () => {
        it('should create a regional', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            mockRepository.create.mockReturnValue(mockRegional);
            mockRepository.save.mockResolvedValue(mockRegional);

            const result = await service.create({ nombre: 'Regional Norte' });
            expect(result).toEqual(mockRegional);
        });

        it('should throw ConflictException if name exists', async () => {
            mockRepository.findOne.mockResolvedValue(mockRegional);
            await expect(service.create({ nombre: 'Regional Norte' })).rejects.toThrow(ConflictException);
        });
    });

    describe('update', () => {
        it('should update a regional', async () => {
            jest.spyOn(service, 'show').mockResolvedValue(mockRegional);
            mockRepository.save.mockResolvedValue({ ...mockRegional, nombre: 'Regional Sur' });

            const result = await service.update(1, { nombre: 'Regional Sur' });
            expect(result.nombre).toBe('Regional Sur');
        });
    });

    describe('delete', () => {
        it('should soft delete a regional', async () => {
            jest.spyOn(service, 'show').mockResolvedValue(mockRegional);
            mockRepository.update.mockResolvedValue({ affected: 1 });

            const result = await service.delete(1);
            expect(result).toEqual({ deleted: true, id: 1 });
        });
    });
});
