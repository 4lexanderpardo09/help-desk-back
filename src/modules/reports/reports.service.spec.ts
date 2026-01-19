import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Consulta } from './entities/consulta.entity';
import { ReportsService } from './reports.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('ReportsService', () => {
    let service: ReportsService;
    let mockQueryBuilder: any;

    const mockReport: Consulta = {
        id: 1,
        nombre: 'Reporte Test',
        sql: 'SELECT * FROM test',
        estado: 1,
        fechaCreacion: new Date(),
    };

    const mockRepository = {
        createQueryBuilder: jest.fn(() => mockQueryBuilder),
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        merge: jest.fn(),
    };

    beforeEach(async () => {
        mockQueryBuilder = {
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([mockReport]),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReportsService,
                {
                    provide: getRepositoryToken(Consulta),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<ReportsService>(ReportsService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('list', () => {
        it('should return reports list', async () => {
            const result = await service.list();
            expect(result).toEqual([mockReport]);
            expect(mockQueryBuilder.where).toHaveBeenCalledWith('consulta.estado = :estado', { estado: 1 });
        });
    });

    describe('show', () => {
        it('should return a report', async () => {
            mockRepository.findOne.mockResolvedValue(mockReport);
            const result = await service.show(1);
            expect(result).toEqual(mockReport);
        });

        it('should throw NotFoundException', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(service.show(999)).rejects.toThrow(NotFoundException);
        });
    });

    describe('create', () => {
        it('should create a report', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            mockRepository.create.mockReturnValue(mockReport);
            mockRepository.save.mockResolvedValue(mockReport);

            const dto = { nombre: 'New Report', sql: 'SELECT 1' };
            const result = await service.create(dto);

            expect(result).toEqual(mockReport);
            expect(mockRepository.save).toHaveBeenCalled();
        });

        it('should throw ConflictException on duplicate name', async () => {
            mockRepository.findOne.mockResolvedValue(mockReport);
            const dto = { nombre: 'Reporte Test', sql: 'SELECT 1' };
            await expect(service.create(dto)).rejects.toThrow(ConflictException);
        });
    });

    describe('delete', () => {
        it('should soft delete', async () => {
            mockRepository.findOne.mockResolvedValue({ ...mockReport });
            mockRepository.save.mockResolvedValue({ ...mockReport, estado: 0 });

            const result = await service.delete(1);

            expect(result.deleted).toBe(true);
            expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({ estado: 0 }));
        });
    });
});
