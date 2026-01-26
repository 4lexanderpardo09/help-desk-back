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
        find: jest.fn(),
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

    describe('getCandidatesForStep', () => {
        it('should return creator if asignarCreador is true', async () => {
            const step = { asignarCreador: true };
            const ticket = { usuarioId: 10 };
            const mockUser = { id: 10, nombre: 'Creator' };

            mockUserRepo.findOne.mockResolvedValue(mockUser);

            const result = await service.getCandidatesForStep(step, ticket);
            expect(result).toEqual([mockUser]);
        });

        it('should return boss if necesitaAprobacionJefe is true', async () => {
            const step = { necesitaAprobacionJefe: true };
            const ticket = { usuarioId: 10 };
            const mockBoss = { id: 99, nombre: 'Boss' };

            // Mock resolveJefeInmediato internal call logic (it calls userRepo/organigramaRepo)
            // But since it's the same service instance, we can't easily mock the private method unless we spy on prototype or just let it run.
            // Let's spy on resolveJefeInmediato to isolate this test unit.
            jest.spyOn(service, 'resolveJefeInmediato').mockResolvedValue(99);
            mockUserRepo.findOne.mockResolvedValue(mockBoss);

            const result = await service.getCandidatesForStep(step, ticket);
            expect(result).toEqual([mockBoss]);
        });

        it('should return empty if boss not found', async () => {
            const step = { necesitaAprobacionJefe: true };
            const ticket = { usuarioId: 10 };

            jest.spyOn(service, 'resolveJefeInmediato').mockResolvedValue(null);

            const result = await service.getCandidatesForStep(step, ticket);
            expect(result).toEqual([]);
        });

        it('should return agents by Role and Regional', async () => {
            const step = { cargoAsignadoId: 5 };
            const ticket = { usuarioId: 10, usuario: { regionalId: 2 } };
            const mockAgents = [{ id: 50, nombre: 'Agent 1' }];

            // Search by Role + Regional
            mockUserRepo.find.mockResolvedValueOnce(mockAgents);

            const result = await service.getCandidatesForStep(step, ticket);
            expect(result).toEqual(mockAgents);
            expect(mockUserRepo.find).toHaveBeenCalledWith(expect.objectContaining({
                where: { cargoId: 5, regionalId: 2, estado: 1 }
            }));
        });

        it('should fallback to Central agents if none in regional', async () => {
            const step = { cargoAsignadoId: 5 };
            const ticket = { usuarioId: 10, usuario: { regionalId: 2 } };
            const mockCentralAgents = [{ id: 51, nombre: 'Agent Central' }];

            // First call returns empty
            mockUserRepo.find.mockResolvedValueOnce([]);
            // Second call (fallback) returns central
            mockUserRepo.find.mockResolvedValueOnce(mockCentralAgents);

            const result = await service.getCandidatesForStep(step, ticket);
            expect(result).toEqual(mockCentralAgents);
        });

        it('should return explicit users if configured', async () => {
            const mockUser = { id: 88, estado: 1 };
            const step = {
                usuarios: [{ usuario: mockUser }]
            };
            const ticket = { usuarioId: 10 };

            const result = await service.getCandidatesForStep(step, ticket);
            expect(result).toEqual([mockUser]);
        });
    });
});
