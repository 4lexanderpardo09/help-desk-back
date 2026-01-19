import { Test, TestingModule } from '@nestjs/testing';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PoliciesGuard } from '../../common/guards/policies.guard';

describe('ProfilesController', () => {
    let controller: ProfilesController;
    let service: ProfilesService;

    const mockProfile = {
        id: 1,
        nombre: 'Administrador',
        estado: 1,
    };

    const mockService = {
        list: jest.fn().mockResolvedValue([mockProfile]),
        show: jest.fn().mockResolvedValue(mockProfile),
        create: jest.fn().mockResolvedValue(mockProfile),
        update: jest.fn().mockResolvedValue({ ...mockProfile, nombre: 'Super Admin' }),
        delete: jest.fn().mockResolvedValue({ deleted: true, id: 1 }),
        syncUserProfiles: jest.fn().mockResolvedValue({ synced: true, userId: 1, perfilCount: 3 }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ProfilesController],
            providers: [
                {
                    provide: ProfilesService,
                    useValue: mockService,
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .overrideGuard(PoliciesGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<ProfilesController>(ProfilesController);
        service = module.get<ProfilesService>(ProfilesService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('findAll', () => {
        it('should return a list of profiles', async () => {
            const result = await controller.findAll({});
            expect(result).toEqual([mockProfile]);
        });
    });

    describe('findOne', () => {
        it('should return a profile', async () => {
            const result = await controller.findOne(1);
            expect(result).toEqual(mockProfile);
        });
    });

    describe('create', () => {
        it('should create a profile', async () => {
            const dto: CreateProfileDto = { nombre: 'Administrador', estado: 1 };
            const result = await controller.create(dto);
            expect(result).toEqual(mockProfile);
        });
    });

    describe('update', () => {
        it('should update a profile', async () => {
            const dto: UpdateProfileDto = { nombre: 'Super Admin' };
            const result = await controller.update(1, dto);
            expect(result.nombre).toBe('Super Admin');
        });
    });

    describe('remove', () => {
        it('should remove a profile', async () => {
            const result = await controller.remove(1);
            expect(result).toEqual({ deleted: true, id: 1 });
        });
    });

    describe('listByUser (using filter)', () => {
        it('should return user profiles via list filter', async () => {
            const result = await controller.listByUser(1);
            expect(mockService.list).toHaveBeenCalledWith({ filter: { usuarioId: 1 } });
        });
    });

    describe('syncUserProfiles', () => {
        it('should sync user profiles', async () => {
            const result = await controller.syncUserProfiles(1, [1, 2, 3]);
            expect(result).toEqual({ synced: true, userId: 1, perfilCount: 3 });
        });
    });
});
