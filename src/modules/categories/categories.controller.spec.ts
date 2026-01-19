import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PoliciesGuard } from '../../common/guards/policies.guard';
import { Categoria } from './entities/categoria.entity';

const mockCategoriesService = {
    create: jest.fn((dto) => Promise.resolve({ id: 1, ...dto, estado: 1 })),
    list: jest.fn(() => Promise.resolve([])),
    show: jest.fn((id) => Promise.resolve({ id, nombre: 'Test', estado: 1 })),
    update: jest.fn((id, dto) => Promise.resolve({ id, ...dto })),
    delete: jest.fn((id) => Promise.resolve()),
};

describe('CategoriesController', () => {
    let controller: CategoriesController;
    let service: CategoriesService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CategoriesController],
            providers: [
                {
                    provide: CategoriesService,
                    useValue: mockCategoriesService,
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .overrideGuard(PoliciesGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<CategoriesController>(CategoriesController);
        service = module.get<CategoriesService>(CategoriesService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create a category', async () => {
            const dto: CreateCategoryDto = { nombre: 'Cat 1', estado: 1 };
            const result = await controller.create(dto);
            expect(result).toEqual({ id: 1, nombre: 'Cat 1', estado: 1 });
            expect(service.create).toHaveBeenCalledWith(dto);
        });
    });

    describe('findAll', () => {
        it('should return an array', async () => {
            const result = await controller.findAll({});
            expect(result).toEqual([]);
        });
    });
});
