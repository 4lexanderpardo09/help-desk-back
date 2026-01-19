import { Test, TestingModule } from '@nestjs/testing';
import { RegionsController } from './regions.controller';
import { RegionsService } from './regions.service';
import { CreateRegionalDto } from './dto/create-regional.dto';
import { UpdateRegionalDto } from './dto/update-regional.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PoliciesGuard } from '../../common/guards/policies.guard';

describe('RegionsController', () => {
    let controller: RegionsController;
    let service: RegionsService;

    const mockRegional = {
        id: 1,
        nombre: 'Regional Norte',
        estado: 1,
        zonaId: 1,
    };

    const mockService = {
        list: jest.fn().mockResolvedValue([mockRegional]),
        show: jest.fn().mockResolvedValue(mockRegional),
        create: jest.fn().mockResolvedValue(mockRegional),
        update: jest.fn().mockResolvedValue({ ...mockRegional, nombre: 'Regional Sur' }),
        delete: jest.fn().mockResolvedValue({ deleted: true, id: 1 }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [RegionsController],
            providers: [
                {
                    provide: RegionsService,
                    useValue: mockService,
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .overrideGuard(PoliciesGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<RegionsController>(RegionsController);
        service = module.get<RegionsService>(RegionsService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('findAll', () => {
        it('should return a list of regionales', async () => {
            const result = await controller.findAll({});
            expect(result).toEqual([mockRegional]);
        });
    });

    describe('findOne', () => {
        it('should return a regional', async () => {
            const result = await controller.findOne(1);
            expect(result).toEqual(mockRegional);
        });
    });

    describe('create', () => {
        it('should create a regional', async () => {
            const dto: CreateRegionalDto = { nombre: 'Regional Norte', zonaId: 1 };
            const result = await controller.create(dto);
            expect(result).toEqual(mockRegional);
        });
    });

    describe('update', () => {
        it('should update a regional', async () => {
            const dto: UpdateRegionalDto = { nombre: 'Regional Sur' };
            const result = await controller.update(1, dto);
            expect(result.nombre).toBe('Regional Sur');
        });
    });

    describe('remove', () => {
        it('should remove a regional', async () => {
            const result = await controller.remove(1);
            expect(result).toEqual({ deleted: true, id: 1 });
        });
    });
});
