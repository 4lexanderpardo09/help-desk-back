import { Test, TestingModule } from '@nestjs/testing';
import { ReglasMapeoController } from './reglas-mapeo.controller';
import { ReglasMapeoService } from './reglas-mapeo.service';
import { CreateReglaMapeoDto } from './dto/create-regla-mapeo.dto';
import { UpdateReglaMapeoDto } from './dto/update-regla-mapeo.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PoliciesGuard } from '../../common/guards/policies.guard';

describe('ReglasMapeoController', () => {
    let controller: ReglasMapeoController;
    let service: ReglasMapeoService;

    const mockRegla = {
        id: 1,
        subcategoriaId: 1,
        estado: 1,
    };

    const mockService = {
        list: jest.fn().mockResolvedValue([mockRegla]),
        show: jest.fn().mockResolvedValue(mockRegla),
        create: jest.fn().mockResolvedValue(mockRegla),
        update: jest.fn().mockResolvedValue({ ...mockRegla, subcategoriaId: 2 }),
        delete: jest.fn().mockResolvedValue({ deleted: true, id: 1 }),

    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ReglasMapeoController],
            providers: [
                {
                    provide: ReglasMapeoService,
                    useValue: mockService,
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .overrideGuard(PoliciesGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<ReglasMapeoController>(ReglasMapeoController);
        service = module.get<ReglasMapeoService>(ReglasMapeoService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('list', () => {
        it('should return a list of reglas', async () => {
            const result = await controller.list({});
            expect(result).toEqual([mockRegla]);
        });
    });

    describe('show', () => {
        it('should return a regla', async () => {
            const result = await controller.show(1);
            expect(result).toEqual(mockRegla);
        });
    });



    describe('create', () => {
        it('should create a regla', async () => {
            const dto: CreateReglaMapeoDto = { subcategoriaId: 1 };
            const result = await controller.create(dto);
            expect(result).toEqual(mockRegla);
        });
    });

    describe('update', () => {
        it('should update a regla', async () => {
            const dto: UpdateReglaMapeoDto = { subcategoriaId: 2 };
            const result = await controller.update(1, dto);
            expect(result.subcategoriaId).toBe(2);
        });
    });

    describe('delete', () => {
        it('should delete a regla', async () => {
            const result = await controller.delete(1);
            expect(result).toEqual({ deleted: true, id: 1 });
        });
    });
});
