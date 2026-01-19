import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PositionsService } from './positions.service';
import { Cargo } from './entities/cargo.entity';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('PositionsService', () => {
    let service: PositionsService;
    let repository: Repository<Cargo>;

    let mockQueryBuilder: any;

    const mockCargo: Cargo = {
        id: 1,
        nombre: 'Administrador',
        estado: 1,
        usuarios: [],
        reglasAsignados: [],
        reglasCreadores: [],
        organigrama: [],
        organigramaJefe: [],
        firmasFlujo: [],
        usuariosFlujo: [],
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
            getMany: jest.fn().mockResolvedValue([mockCargo]),
            getOne: jest.fn().mockResolvedValue(mockCargo),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PositionsService,
                {
                    provide: getRepositoryToken(Cargo),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<PositionsService>(PositionsService);
        repository = module.get<Repository<Cargo>>(getRepositoryToken(Cargo));

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('list', () => {
        it('should return an array of positions', async () => {
            const result = await service.list();
            expect(result).toEqual([mockCargo]);
            expect(repository.createQueryBuilder).toHaveBeenCalled();
        });
    });

    describe('show', () => {
        it('should return a position by id', async () => {
            const result = await service.show(1);
            expect(result).toEqual(mockCargo);
        });

        it('should throw NotFoundException if position not found', async () => {
            mockQueryBuilder.getOne.mockResolvedValueOnce(null);
            await expect(service.show(999)).rejects.toThrow(NotFoundException);
        });
    });

    describe('create', () => {
        it('should create a position successfully', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            mockRepository.create.mockReturnValue(mockCargo);
            mockRepository.save.mockResolvedValue(mockCargo);

            const result = await service.create({ nombre: 'Administrador' });
            expect(result).toEqual(mockCargo);
            expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { nombre: 'Administrador' } });
            expect(mockRepository.save).toHaveBeenCalled();
        });

        it('should throw ConflictException if name exists', async () => {
            mockRepository.findOne.mockResolvedValue(mockCargo);
            await expect(service.create({ nombre: 'Administrador' })).rejects.toThrow(ConflictException);
        });
    });

    describe('update', () => {
        it('should update a position', async () => {
            jest.spyOn(service, 'show').mockResolvedValue(mockCargo);
            mockRepository.save.mockResolvedValue({ ...mockCargo, nombre: 'Super Admin' });

            const result = await service.update(1, { nombre: 'Super Admin' });
            expect(result.nombre).toBe('Super Admin');
            expect(mockRepository.merge).toHaveBeenCalled();
            expect(mockRepository.save).toHaveBeenCalled();
        });
    });

    describe('delete', () => {
        it('should soft delete a position', async () => {
            jest.spyOn(service, 'show').mockResolvedValue(mockCargo);
            mockRepository.update.mockResolvedValue({ affected: 1 });

            const result = await service.delete(1);
            expect(result).toEqual({ deleted: true, id: 1 });
            expect(mockRepository.update).toHaveBeenCalledWith(1, { estado: 0 });
        });
    });
});
