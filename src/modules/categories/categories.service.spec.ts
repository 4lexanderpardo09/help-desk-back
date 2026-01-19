import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Categoria } from './entities/categoria.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

const mockCategoryRepository = () => ({
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
        getMany: jest.fn(),
    })),
});

describe('CategoriesService', () => {
    let service: CategoriesService;
    let repository: Repository<Categoria>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CategoriesService,
                {
                    provide: getRepositoryToken(Categoria),
                    useFactory: mockCategoryRepository,
                },
            ],
        }).compile();

        service = module.get<CategoriesService>(CategoriesService);
        repository = module.get<Repository<Categoria>>(getRepositoryToken(Categoria));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a category', async () => {
            const createDto: CreateCategoryDto = { nombre: 'Test Cat', estado: 1 };
            const savedCategory = { id: 1, ...createDto };
            (repository.create as jest.Mock).mockReturnValue(savedCategory);
            (repository.save as jest.Mock).mockResolvedValue(savedCategory);

            const result = await service.create(createDto);
            expect(result).toEqual(savedCategory);
            expect(repository.create).toHaveBeenCalledWith(createDto);
            expect(repository.save).toHaveBeenCalledWith(savedCategory);
        });
    });

    // Se pueden añadir más tests para show, update, delete...
});
