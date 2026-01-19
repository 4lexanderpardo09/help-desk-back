import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentsService } from './departments.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Departamento } from './entities/departamento.entity';
import { Repository } from 'typeorm';
import { CreateDepartmentDto } from './dto/create-department.dto';

const mockDepartmentRepository = () => ({
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
        getMany: jest.fn(),
    })),
    findOne: jest.fn(),
    merge: jest.fn(),
});

describe('DepartmentsService', () => {
    let service: DepartmentsService;
    let repository: Repository<Departamento>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DepartmentsService,
                {
                    provide: getRepositoryToken(Departamento),
                    useFactory: mockDepartmentRepository,
                },
            ],
        }).compile();

        service = module.get<DepartmentsService>(DepartmentsService);
        repository = module.get<Repository<Departamento>>(getRepositoryToken(Departamento));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a department', async () => {
            const createDto: CreateDepartmentDto = { nombre: 'Test Dept', estado: 1 };
            const savedDept = { id: 1, ...createDto, fechaCreacion: new Date(), fechaModificacion: null, fechaEliminacion: null, usuarios: [], categorias: [], tickets: [] };

            (repository.findOne as jest.Mock).mockResolvedValue(null);
            (repository.create as jest.Mock).mockReturnValue(savedDept);
            (repository.save as jest.Mock).mockResolvedValue(savedDept);

            const result = await service.create(createDto);
            expect(result).toEqual(savedDept);
            expect(repository.create).toHaveBeenCalled();
            expect(repository.save).toHaveBeenCalled();
        });
    });
});
