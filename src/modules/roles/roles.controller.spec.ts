import { Test, TestingModule } from '@nestjs/testing';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PoliciesGuard } from '../../common/guards/policies.guard';

describe('RolesController', () => {
    let controller: RolesController;
    let service: RolesService;

    const mockRole = {
        id: 1,
        nombre: 'Administrador',
        estado: 1,
    };

    const mockService = {
        list: jest.fn().mockResolvedValue([mockRole]),
        show: jest.fn().mockResolvedValue(mockRole),
        create: jest.fn().mockResolvedValue(mockRole),
        update: jest.fn().mockResolvedValue({ ...mockRole, nombre: 'Super Admin' }),
        delete: jest.fn().mockResolvedValue({ deleted: true, id: 1 }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [RolesController],
            providers: [
                {
                    provide: RolesService,
                    useValue: mockService,
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .overrideGuard(PoliciesGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<RolesController>(RolesController);
        service = module.get<RolesService>(RolesService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('findAll', () => {
        it('should return a list of roles', async () => {
            const result = await controller.findAll({});
            expect(result).toEqual([mockRole]);
        });
    });

    describe('findOne', () => {
        it('should return a role', async () => {
            const result = await controller.findOne(1);
            expect(result).toEqual(mockRole);
        });
    });

    describe('create', () => {
        it('should create a role', async () => {
            const dto: CreateRoleDto = { nombre: 'Administrador', estado: 1 };
            const result = await controller.create(dto);
            expect(result).toEqual(mockRole);
        });
    });

    describe('update', () => {
        it('should update a role', async () => {
            const dto: UpdateRoleDto = { nombre: 'Super Admin' };
            const result = await controller.update(1, dto);
            expect(result.nombre).toBe('Super Admin');
        });
    });

    describe('remove', () => {
        it('should remove a role', async () => {
            const result = await controller.remove(1);
            expect(result).toEqual({ deleted: true, id: 1 });
        });
    });
});
