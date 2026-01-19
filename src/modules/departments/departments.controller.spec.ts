import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PoliciesGuard } from '../../common/guards/policies.guard';

const mockDepartmentsService = {
    create: jest.fn((dto) => Promise.resolve({ id: 1, ...dto, estado: 1 })),
    list: jest.fn(() => Promise.resolve([])),
    show: jest.fn((id) => Promise.resolve({ id, nombre: 'Test Dept', estado: 1 })),
    update: jest.fn((id, dto) => Promise.resolve({ id, ...dto })),
    delete: jest.fn((id) => Promise.resolve({ deleted: true, id })),
};

describe('DepartmentsController', () => {
    let controller: DepartmentsController;
    let service: DepartmentsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [DepartmentsController],
            providers: [
                {
                    provide: DepartmentsService,
                    useValue: mockDepartmentsService,
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .overrideGuard(PoliciesGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<DepartmentsController>(DepartmentsController);
        service = module.get<DepartmentsService>(DepartmentsService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create a department', async () => {
            const dto: CreateDepartmentDto = { nombre: 'Dept 1', estado: 1 };
            const result = await controller.create(dto);
            expect(result).toEqual({ id: 1, nombre: 'Dept 1', estado: 1 });
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
