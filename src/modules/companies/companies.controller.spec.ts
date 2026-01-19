import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PoliciesGuard } from '../../common/guards/policies.guard';

const mockCompaniesService = {
    create: jest.fn((dto) => Promise.resolve({ id: 1, ...dto, estado: 1 })),
    list: jest.fn(() => Promise.resolve([])),
    show: jest.fn((id) => Promise.resolve({ id, nombre: 'Test', estado: 1 })),
    update: jest.fn((id, dto) => Promise.resolve({ id, ...dto })),
    delete: jest.fn((id) => Promise.resolve({ deleted: true, id })),
};

describe('CompaniesController', () => {
    let controller: CompaniesController;
    let service: CompaniesService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CompaniesController],
            providers: [
                {
                    provide: CompaniesService,
                    useValue: mockCompaniesService,
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .overrideGuard(PoliciesGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<CompaniesController>(CompaniesController);
        service = module.get<CompaniesService>(CompaniesService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create a company', async () => {
            const dto: CreateCompanyDto = { nombre: 'Comp 1', estado: 1 };
            const result = await controller.create(dto);
            expect(result).toEqual({ id: 1, nombre: 'Comp 1', estado: 1 });
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
