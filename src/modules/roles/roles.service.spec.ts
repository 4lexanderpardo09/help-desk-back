import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RolesService } from './roles.service';
import { Role } from './entities/role.entity';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('RolesService', () => {
    let service: RolesService;
    let repository: Repository<Role>;

    let mockQueryBuilder: any;

    const mockRole: Role = {
        id: 1,
        nombre: 'Administrador',
        descripcion: 'Admin del sistema',
        estado: 1,
        usuarios: [],
    };

    const mockRepository = {
        createQueryBuilder: jest.fn(() => mockQueryBuilder),
        findOne: jest.fn().mockResolvedValue(mockRole),
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
            getMany: jest.fn().mockResolvedValue([mockRole]),
            getOne: jest.fn().mockResolvedValue(mockRole),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RolesService,
                {
                    provide: getRepositoryToken(Role),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<RolesService>(RolesService);
        repository = module.get<Repository<Role>>(getRepositoryToken(Role));

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('list', () => {
        it('should return an array of roles', async () => {
            const result = await service.list();
            expect(result).toEqual([mockRole]);
            expect(repository.createQueryBuilder).toHaveBeenCalled();
        });
    });

    describe('show', () => {
        it('should return a role by id', async () => {
            const result = await service.show(1);
            expect(result).toEqual(mockRole);
        });

        it('should throw NotFoundException if role not found', async () => {
            mockRepository.findOne.mockResolvedValueOnce(null);
            await expect(service.show(999)).rejects.toThrow(NotFoundException);
        });
    });

    describe('create', () => {
        it('should create a role successfully', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            mockRepository.create.mockReturnValue(mockRole);
            mockRepository.save.mockResolvedValue(mockRole);

            const result = await service.create({ nombre: 'Administrador' });
            expect(result).toEqual(mockRole);
        });

        it('should throw ConflictException if name exists', async () => {
            mockRepository.findOne.mockResolvedValue(mockRole);
            await expect(service.create({ nombre: 'Administrador' })).rejects.toThrow(ConflictException);
        });
    });

    describe('update', () => {
        it('should update a role', async () => {
            jest.spyOn(service, 'show').mockResolvedValue(mockRole);
            mockRepository.save.mockResolvedValue({ ...mockRole, nombre: 'Super Admin' });

            const result = await service.update(1, { nombre: 'Super Admin' });
            expect(result.nombre).toBe('Super Admin');
        });
    });

    describe('delete', () => {
        it('should soft delete a role', async () => {
            jest.spyOn(service, 'show').mockResolvedValue(mockRole);
            mockRepository.update.mockResolvedValue({ affected: 1 });

            const result = await service.delete(1);
            expect(result).toEqual({ deleted: true, id: 1 });
        });
    });
});
