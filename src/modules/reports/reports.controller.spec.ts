import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PoliciesGuard } from '../../common/guards/policies.guard';

describe('ReportsController', () => {
    let controller: ReportsController;

    const mockReport = {
        id: 1,
        nombre: 'Test',
        sql: 'SELECT 1',
        estado: 1,
    };

    const mockService = {
        list: jest.fn().mockResolvedValue([mockReport]),
        show: jest.fn().mockResolvedValue(mockReport),
        create: jest.fn().mockResolvedValue(mockReport),
        update: jest.fn().mockResolvedValue({ ...mockReport, nombre: 'Updated' }),
        delete: jest.fn().mockResolvedValue({ deleted: true, id: 1 }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ReportsController],
            providers: [
                {
                    provide: ReportsService,
                    useValue: mockService,
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .overrideGuard(PoliciesGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<ReportsController>(ReportsController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('list', () => {
        it('should return list', async () => {
            const result = await controller.list({});
            expect(result).toEqual([mockReport]);
        });
    });

    describe('create', () => {
        it('should create report', async () => {
            const result = await controller.create({ nombre: 'Test', sql: 'SELECT 1' });
            expect(result).toEqual(mockReport);
        });
    });
});
