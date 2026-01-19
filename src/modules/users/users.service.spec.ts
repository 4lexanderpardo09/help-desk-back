import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';

jest.mock('bcrypt', () => ({
    hash: jest.fn().mockResolvedValue('hashedPassword'),
    compare: jest.fn().mockResolvedValue(true),
}));

const mockUserRepository = () => ({
    create: jest.fn(),
    save: jest.fn(),
    exists: jest.fn(),
    findOne: jest.fn(),
    merge: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
        getMany: jest.fn(),
    })),
});

const mockDataSource = {
    transaction: jest.fn(),
};

describe('UsersService', () => {
    let service: UsersService;
    let repository: Repository<User>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: getRepositoryToken(User),
                    useFactory: mockUserRepository,
                },
                {
                    provide: DataSource,
                    useValue: mockDataSource,
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        repository = module.get<Repository<User>>(getRepositoryToken(User));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a user with companies', async () => {
            const createDto: CreateUserDto = {
                nombre: 'John',
                apellido: 'Doe',
                email: 'john@example.com',
                password: 'password123',
                rolId: 1,
                esNacional: true,
                empresasIds: [1, 2],
            };

            const hashedPassword = 'hashedPassword';
            // (bcrypt.hash as any) = jest.fn().mockResolvedValue(hashedPassword); // Removed

            const savedUser = {
                id: 1,
                ...createDto,
                password: hashedPassword,
                empresas: [{ id: 1 }, { id: 2 }],
            };

            (repository.exists as jest.Mock).mockResolvedValue(false);
            (repository.create as jest.Mock).mockReturnValue({
                ...createDto,
                password: hashedPassword,
                empresas: [{ id: 1 }, { id: 2 }],
            } as any);
            (repository.save as jest.Mock).mockResolvedValue(savedUser);

            const result = await service.create(createDto);

            expect(result.empresas).toHaveLength(2);
            expect(repository.create).toHaveBeenCalled();
            expect(repository.save).toHaveBeenCalled();
        });
    });
});
