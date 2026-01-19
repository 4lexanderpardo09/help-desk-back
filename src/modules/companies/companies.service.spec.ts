import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesService } from './companies.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Empresa } from './entities/empresa.entity';
import { Repository } from 'typeorm';
import { CreateCompanyDto } from './dto/create-company.dto';

const mockCompanyRepository = () => ({
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

describe('CompaniesService', () => {
    let service: CompaniesService;
    let repository: Repository<Empresa>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CompaniesService,
                {
                    provide: getRepositoryToken(Empresa),
                    useFactory: mockCompanyRepository,
                },
            ],
        }).compile();

        service = module.get<CompaniesService>(CompaniesService);
        repository = module.get<Repository<Empresa>>(getRepositoryToken(Empresa));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a company with relations', async () => {
            const createDto: CreateCompanyDto = {
                nombre: 'Test Company',
                estado: 1,
                usuariosIds: [1, 2],
                categoriasIds: [3]
            };
            const savedCompany = {
                id: 1,
                ...createDto,
                fechaCreacion: new Date(),
                usuarios: [{ id: 1 }, { id: 2 }],
                categorias: [{ id: 3 }],
                tickets: [],
                flujosPlantilla: [],
                fechaEliminacion: null
            };

            (repository.findOne as jest.Mock).mockResolvedValue(null);
            (repository.create as jest.Mock).mockReturnValue({
                ...createDto,
                usuarios: [{ id: 1 }, { id: 2 }],
                categorias: [{ id: 3 }]
            } as any);
            (repository.save as jest.Mock).mockResolvedValue(savedCompany);

            const result = await service.create(createDto);
            expect(result).toEqual(savedCompany);
            expect(repository.create).toHaveBeenCalled();
            expect(repository.save).toHaveBeenCalled();
        });
    });
});
