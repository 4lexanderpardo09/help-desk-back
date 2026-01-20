import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentService } from './assignment.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Organigrama } from '../positions/entities/organigrama.entity';
import { Cargo } from '../positions/entities/cargo.entity';

describe('AssignmentService', () => {
    let service: AssignmentService;

    const mockUserRepo = {
        findOne: jest.fn(),
    };

    const mockOrganigramaRepo = {
        findOne: jest.fn(),
    };

    const mockCargoRepo = {
        findOne: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AssignmentService,
                { provide: getRepositoryToken(User), useValue: mockUserRepo },
                { provide: getRepositoryToken(Organigrama), useValue: mockOrganigramaRepo },
                { provide: getRepositoryToken(Cargo), useValue: mockCargoRepo },
            ],
        }).compile();

        service = module.get<AssignmentService>(AssignmentService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('resolveJefeInmediato', () => {
        it('should return null if user not found or has no cargo', async () => {
            mockUserRepo.findOne.mockResolvedValue({ id: 1, cargoId: null });
            const result = await service.resolveJefeInmediato(1);
            expect(result).toBeNull();
        });

        it('should return null if no boss relationship exists in organigrama', async () => {
            mockUserRepo.findOne.mockResolvedValue({ id: 1, cargoId: 10 });
            mockOrganigramaRepo.findOne.mockResolvedValue(null);

            const result = await service.resolveJefeInmediato(1);
            expect(result).toBeNull();
        });

        it('should return boss in same regional if found', async () => {
            // 1. User is Analyst (10) in Regional A (5)
            mockUserRepo.findOne.mockReturnValueOnce({ id: 1, cargoId: 10, regionalId: 5 });

            // 2. Organigrama says Analyst (10) reports to Manager (20)
            mockOrganigramaRepo.findOne.mockResolvedValue({ cargoId: 10, jefeCargoId: 20 });

            // 3. Find Boss: First try same regional
            mockUserRepo.findOne.mockReturnValueOnce({ id: 99, cargoId: 20, regionalId: 5 });

            const result = await service.resolveJefeInmediato(1);
            expect(result).toBe(99);
            expect(mockUserRepo.findOne).toHaveBeenCalledTimes(2);
        });

        it('should fall back to any boss if none in regional', async () => {
            // 1. User
            mockUserRepo.findOne.mockReturnValueOnce({ id: 1, cargoId: 10, regionalId: 5 });
            // 2. Org
            mockOrganigramaRepo.findOne.mockResolvedValue({ cargoId: 10, jefeCargoId: 20 });
            // 3. Same regional -> null
            mockUserRepo.findOne.mockReturnValueOnce(null);
            // 4. Any regional -> found
            mockUserRepo.findOne.mockReturnValueOnce({ id: 88, cargoId: 20, regionalId: 1 });

            const result = await service.resolveJefeInmediato(1);
            expect(result).toBe(88);
        });
    });

    describe('resolveRegionalAgent', () => {
        it('should return agent in specific regional', async () => {
            mockUserRepo.findOne.mockResolvedValue({ id: 50, cargoId: 5, regionalId: 2 });
            const result = await service.resolveRegionalAgent(5, 2);
            expect(result).toBe(50);
        });

        it('should return null if no agent found', async () => {
            mockUserRepo.findOne.mockResolvedValue(null);
            const result = await service.resolveRegionalAgent(99, 99);
            expect(result).toBeNull();
        });
    });
});
