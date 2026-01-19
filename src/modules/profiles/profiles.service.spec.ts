import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProfilesService } from './profiles.service';
import { Perfil } from './entities/perfil.entity';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('ProfilesService', () => {
    let service: ProfilesService;
    let repository: Repository<Perfil>;

    let mockQueryBuilder: any;

    const mockPerfil: Perfil = {
        id: 1,
        nombre: 'Administrador',
        estado: 1,
        fechaCreacion: new Date(),
        fechaModificacion: null,
        fechaEliminacion: null,
        usuarioPerfiles: [],
        reglasCreadoresPerfil: [],
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
            innerJoin: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([mockPerfil]),
            getOne: jest.fn().mockResolvedValue(mockPerfil),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProfilesService,
                {
                    provide: getRepositoryToken(Perfil),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<ProfilesService>(ProfilesService);
        repository = module.get<Repository<Perfil>>(getRepositoryToken(Perfil));

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('list', () => {
        it('should return an array of profiles', async () => {
            const result = await service.list();
            expect(result).toEqual([mockPerfil]);
            expect(repository.createQueryBuilder).toHaveBeenCalled();
        });
    });

    describe('show', () => {
        it('should return a profile by id', async () => {
            const result = await service.show(1);
            expect(result).toEqual(mockPerfil);
        });

        it('should throw NotFoundException if profile not found', async () => {
            mockQueryBuilder.getOne.mockResolvedValueOnce(null);
            await expect(service.show(999)).rejects.toThrow(NotFoundException);
        });
    });

    describe('create', () => {
        it('should create a profile successfully', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            mockRepository.create.mockReturnValue(mockPerfil);
            mockRepository.save.mockResolvedValue(mockPerfil);

            const result = await service.create({ nombre: 'Administrador' });
            expect(result).toEqual(mockPerfil);
        });

        it('should throw ConflictException if name exists', async () => {
            mockRepository.findOne.mockResolvedValue(mockPerfil);
            await expect(service.create({ nombre: 'Administrador' })).rejects.toThrow(ConflictException);
        });
    });

    describe('update', () => {
        it('should update a profile', async () => {
            jest.spyOn(service, 'show').mockResolvedValue(mockPerfil);
            mockRepository.save.mockResolvedValue({ ...mockPerfil, nombre: 'Super Admin' });

            const result = await service.update(1, { nombre: 'Super Admin' });
            expect(result.nombre).toBe('Super Admin');
        });
    });

    describe('delete', () => {
        it('should soft delete a profile', async () => {
            jest.spyOn(service, 'show').mockResolvedValue(mockPerfil);
            mockRepository.update.mockResolvedValue({ affected: 1 });

            const result = await service.delete(1);
            expect(result).toEqual({ deleted: true, id: 1 });
        });
    });
});
