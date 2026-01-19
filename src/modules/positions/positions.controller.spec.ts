import { Test, TestingModule } from '@nestjs/testing';
import { PositionsController } from './positions.controller';
import { PositionsService } from './positions.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PoliciesGuard } from '../../common/guards/policies.guard';

describe('PositionsController', () => {
    let controller: PositionsController;
    let service: PositionsService;

    const mockPosition = {
        id: 1,
        nombre: 'Administrador',
        estado: 1,
    };

    const mockService = {
        list: jest.fn().mockResolvedValue([mockPosition]),
        show: jest.fn().mockResolvedValue(mockPosition),
        create: jest.fn().mockResolvedValue(mockPosition),
        update: jest.fn().mockResolvedValue({ ...mockPosition, nombre: 'Super Admin' }),
        delete: jest.fn().mockResolvedValue({ deleted: true, id: 1 }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PositionsController],
            providers: [
                {
                    provide: PositionsService,
                    useValue: mockService,
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .overrideGuard(PoliciesGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<PositionsController>(PositionsController);
        service = module.get<PositionsService>(PositionsService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('findAll', () => {
        it('should return a list of positions', async () => {
            const result = await controller.findAll({});
            expect(result).toEqual([mockPosition]);
            expect(mockService.list).toHaveBeenCalled();
        });
    });

    describe('findOne', () => {
        it('should return a position', async () => {
            const result = await controller.findOne(1);
            expect(result).toEqual(mockPosition);
            expect(mockService.show).toHaveBeenCalledWith(1, { included: undefined });
        });
    });

    describe('create', () => {
        it('should create a position', async () => {
            const dto: CreatePositionDto = { nombre: 'Administrador', estado: 1 };
            const result = await controller.create(dto);
            expect(result).toEqual(mockPosition);
            expect(mockService.create).toHaveBeenCalledWith(dto);
        });
    });

    describe('update', () => {
        it('should update a position', async () => {
            const dto: UpdatePositionDto = { nombre: 'Super Admin' };
            const result = await controller.update(1, dto);
            expect(result.nombre).toBe('Super Admin');
            expect(mockService.update).toHaveBeenCalledWith(1, dto);
        });
    });

    describe('remove', () => {
        it('should remove a position', async () => {
            const result = await controller.remove(1);
            expect(result).toEqual({ deleted: true, id: 1 });
            expect(mockService.delete).toHaveBeenCalledWith(1);
        });
    });
});
