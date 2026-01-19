import { Test, TestingModule } from '@nestjs/testing';
import { PrioritiesController } from './priorities.controller';
import { PrioritiesService } from './priorities.service';
import { CreatePriorityDto } from './dto/create-priority.dto';
import { UpdatePriorityDto } from './dto/update-priority.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PoliciesGuard } from '../../common/guards/policies.guard';
import { AppAbility } from '../auth/abilities/ability.factory';

describe('PrioritiesController', () => {
    let controller: PrioritiesController;
    let service: PrioritiesService;

    const mockPriority = {
        id: 1,
        nombre: 'Alta',
        estado: 1,
    };

    const mockService = {
        list: jest.fn().mockResolvedValue([mockPriority]),
        show: jest.fn().mockResolvedValue(mockPriority),
        create: jest.fn().mockResolvedValue(mockPriority),
        update: jest.fn().mockResolvedValue({ ...mockPriority, nombre: 'Media' }),
        delete: jest.fn().mockResolvedValue({ deleted: true, id: 1 }),
    };

    const mockAbility = {
        can: jest.fn().mockReturnValue(true),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PrioritiesController],
            providers: [
                {
                    provide: PrioritiesService,
                    useValue: mockService,
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .overrideGuard(PoliciesGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<PrioritiesController>(PrioritiesController);
        service = module.get<PrioritiesService>(PrioritiesService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('findAll', () => {
        it('should return a list of priorities', async () => {
            const result = await controller.findAll({});
            expect(result).toEqual([mockPriority]);
            expect(mockService.list).toHaveBeenCalled();
        });
    });

    describe('findOne', () => {
        it('should return a priority', async () => {
            const result = await controller.findOne(1);
            expect(result).toEqual(mockPriority);
            expect(mockService.show).toHaveBeenCalledWith(1, { included: undefined });
        });
    });

    describe('create', () => {
        it('should create a priority', async () => {
            const dto: CreatePriorityDto = { nombre: 'Alta', estado: 1 };
            const result = await controller.create(dto);
            expect(result).toEqual(mockPriority);
            expect(mockService.create).toHaveBeenCalledWith(dto);
        });
    });

    describe('update', () => {
        it('should update a priority', async () => {
            const dto: UpdatePriorityDto = { nombre: 'Media' };
            const result = await controller.update(1, dto);
            expect(result.nombre).toBe('Media');
            expect(mockService.update).toHaveBeenCalledWith(1, dto);
        });
    });

    describe('remove', () => {
        it('should remove a priority', async () => {
            const result = await controller.remove(1);
            expect(result).toEqual({ deleted: true, id: 1 });
            expect(mockService.delete).toHaveBeenCalledWith(1);
        });
    });
});
