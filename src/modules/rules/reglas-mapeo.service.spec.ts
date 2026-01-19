import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ReglasMapeoService } from './reglas-mapeo.service';
import { ReglaMapeo } from './entities/regla-mapeo.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('ReglasMapeoService', () => {
    let service: ReglasMapeoService;

    let mockQueryBuilder: any;

    const mockRegla: ReglaMapeo = {
        id: 1,
        subcategoriaId: 1,
        estado: 1,
        subcategoria: null as any,
        creadores: [],
        asignados: [],
        creadoresPerfil: [],
    };

    const mockRepository = {
        createQueryBuilder: jest.fn(() => mockQueryBuilder),
        exists: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        findOne: jest.fn(),
    };

    const mockDataSource = {
        transaction: jest.fn((callback) => callback({
            create: jest.fn().mockReturnValue(mockRegla),
            save: jest.fn().mockResolvedValue(mockRegla),
            delete: jest.fn().mockResolvedValue({ affected: 1 }),
        })),
    };

    beforeEach(async () => {
        mockQueryBuilder = {
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([mockRegla]),
            getOne: jest.fn().mockResolvedValue(mockRegla),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReglasMapeoService,
                {
                    provide: getRepositoryToken(ReglaMapeo),
                    useValue: mockRepository,
                },
                {
                    provide: DataSource,
                    useValue: mockDataSource,
                },
            ],
        }).compile();

        service = module.get<ReglasMapeoService>(ReglasMapeoService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('list', () => {
        it('should return an array of reglas', async () => {
            const result = await service.list();
            expect(result).toEqual([mockRegla]);
        });
    });

    describe('show', () => {
        it('should return a regla by id', async () => {
            mockQueryBuilder.getOne.mockResolvedValue(mockRegla);
            const result = await service.show(1);
            expect(result).toEqual(mockRegla);
        });

        it('should throw NotFoundException if regla not found', async () => {
            mockQueryBuilder.getOne.mockResolvedValue(null);
            await expect(service.show(999)).rejects.toThrow(NotFoundException);
        });
    });

    describe('create', () => {
        it('should create a regla successfully', async () => {
            mockRepository.exists.mockResolvedValue(false);

            const result = await service.create({ subcategoriaId: 1 });
            expect(result).toEqual(mockRegla);
        });

        it('should throw ConflictException if regla exists for subcategoria', async () => {
            mockRepository.exists.mockResolvedValue(true);
            await expect(service.create({ subcategoriaId: 1 })).rejects.toThrow(ConflictException);
        });
    });

    describe('delete', () => {
        it('should soft delete a regla', async () => {
            jest.spyOn(service, 'show').mockResolvedValue(mockRegla);
            mockRepository.update.mockResolvedValue({ affected: 1 });

            const result = await service.delete(1);
            expect(result).toEqual({ deleted: true, id: 1 });
        });
    });
});
