import { Test, TestingModule } from '@nestjs/testing';
import { SubcategoriasController } from './subcategorias.controller';
import { SubcategoriasService } from './subcategorias.service';
import { CreateSubcategoriaDto } from './dto/create-subcategoria.dto';
import { UpdateSubcategoriaDto } from './dto/update-subcategoria.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PoliciesGuard } from '../../common/guards/policies.guard';

describe('SubcategoriasController', () => {
    let controller: SubcategoriasController;
    let service: SubcategoriasService;

    const mockSubcategoria = {
        id: 1,
        nombre: 'Software',
        estado: 1,
    };

    const mockService = {
        list: jest.fn().mockResolvedValue([mockSubcategoria]),
        show: jest.fn().mockResolvedValue(mockSubcategoria),
        create: jest.fn().mockResolvedValue(mockSubcategoria),
        update: jest.fn().mockResolvedValue({ ...mockSubcategoria, nombre: 'Hardware' }),
        delete: jest.fn().mockResolvedValue({ deleted: true, id: 1 }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [SubcategoriasController],
            providers: [
                {
                    provide: SubcategoriasService,
                    useValue: mockService,
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .overrideGuard(PoliciesGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<SubcategoriasController>(SubcategoriasController);
        service = module.get<SubcategoriasService>(SubcategoriasService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('list', () => {
        it('should return a list of subcategorias', async () => {
            const result = await controller.list({});
            expect(result).toEqual([mockSubcategoria]);
            expect(service.list).toHaveBeenCalledWith({
                limit: undefined,
                page: undefined,
                filter: undefined,
                included: undefined,
            });
        });
    });

    describe('show', () => {
        it('should return a subcategoria', async () => {
            const result = await controller.show(1);
            expect(result).toEqual(mockSubcategoria);
            expect(service.show).toHaveBeenCalledWith(1, { included: undefined });
        });
    });

    describe('create', () => {
        it('should create a subcategoria', async () => {
            const dto: CreateSubcategoriaDto = { nombre: 'Software', categoriaId: 1 };
            const result = await controller.create(dto);
            expect(result).toEqual(mockSubcategoria);
        });
    });

    describe('update', () => {
        it('should update a subcategoria', async () => {
            const dto: UpdateSubcategoriaDto = { nombre: 'Hardware' };
            const result = await controller.update(1, dto);
            expect(result.nombre).toBe('Hardware');
        });
    });

    describe('delete', () => {
        it('should delete a subcategoria', async () => {
            const result = await controller.delete(1);
            expect(result).toEqual({ deleted: true, id: 1 });
        });
    });
});
