import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SubcategoriasService } from './subcategorias.service';
import { Subcategoria } from './entities/subcategoria.entity';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('SubcategoriasService', () => {
    let service: SubcategoriasService;
    let repository: Repository<Subcategoria>;

    let mockQueryBuilder: any;

    const mockSubcategoria: Subcategoria = {
        id: 1,
        nombre: 'Software',
        descripcion: 'Problemas de software',
        categoriaId: 1,
        prioridadId: 1,
        estado: 1,
        categoria: null as any,
        prioridad: null as any,
        reglaMapeo: [],
        tickets: [],
    };

    const mockRepository = {
        createQueryBuilder: jest.fn(() => mockQueryBuilder),
        exists: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        merge: jest.fn(),
        update: jest.fn(),
    };

    beforeEach(async () => {
        mockQueryBuilder = {
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([mockSubcategoria]),
            getOne: jest.fn().mockResolvedValue(mockSubcategoria),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SubcategoriasService,
                {
                    provide: getRepositoryToken(Subcategoria),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<SubcategoriasService>(SubcategoriasService);
        repository = module.get<Repository<Subcategoria>>(getRepositoryToken(Subcategoria));

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('list', () => {
        it('should return an array of subcategorias', async () => {
            const result = await service.list();
            expect(result).toEqual([mockSubcategoria]);
            expect(repository.createQueryBuilder).toHaveBeenCalled();
        });
    });

    describe('show', () => {
        it('should return a subcategoria by id', async () => {
            mockQueryBuilder.getOne.mockResolvedValue(mockSubcategoria);
            const result = await service.show(1);
            expect(result).toEqual(mockSubcategoria);
        });

        it('should throw NotFoundException if subcategoria not found', async () => {
            mockQueryBuilder.getOne.mockResolvedValue(null);
            await expect(service.show(999)).rejects.toThrow(NotFoundException);
        });
    });

    describe('create', () => {
        it('should create a subcategoria successfully', async () => {
            mockRepository.exists.mockResolvedValue(false);
            mockRepository.create.mockReturnValue(mockSubcategoria);
            mockRepository.save.mockResolvedValue(mockSubcategoria);

            const result = await service.create({ nombre: 'Software', categoriaId: 1 });
            expect(result).toEqual(mockSubcategoria);
        });

        it('should throw ConflictException if name exists in category', async () => {
            mockRepository.exists.mockResolvedValue(true);
            await expect(service.create({ nombre: 'Software', categoriaId: 1 })).rejects.toThrow(ConflictException);
        });
    });

    describe('update', () => {
        it('should update a subcategoria', async () => {
            jest.spyOn(service, 'show').mockResolvedValue(mockSubcategoria);
            mockRepository.save.mockResolvedValue({ ...mockSubcategoria, nombre: 'Hardware' });

            const result = await service.update(1, { nombre: 'Hardware' });
            expect(result.nombre).toBe('Hardware');
        });
    });

    describe('delete', () => {
        it('should soft delete a subcategoria', async () => {
            jest.spyOn(service, 'show').mockResolvedValue(mockSubcategoria);
            mockRepository.update.mockResolvedValue({ affected: 1 });

            const result = await service.delete(1);
            expect(result).toEqual({ deleted: true, id: 1 });
        });
    });
});
