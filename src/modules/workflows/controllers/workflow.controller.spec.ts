import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowController } from './workflow.controller';
import { WorkflowEngineService } from '../services/workflow-engine.service';
import { AbilityFactory } from '../../auth/abilities/ability.factory';

describe('WorkflowController', () => {
    let controller: WorkflowController;
    let service: WorkflowEngineService;

    const mockService = {
        transitionStep: jest.fn(),
        checkStartFlow: jest.fn(),
        approveFlow: jest.fn(),
    };

    const mockAbilityFactory = {
        createForUser: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [WorkflowController],
            providers: [
                { provide: WorkflowEngineService, useValue: mockService },
                { provide: AbilityFactory, useValue: mockAbilityFactory },
            ],
        })
            .overrideGuard(require('../../../common/guards/policies.guard').PoliciesGuard)
            .useValue({ canActivate: () => true }) // Mock PoliciesGuard
            .compile();

        controller = module.get<WorkflowController>(WorkflowController);
        service = module.get<WorkflowEngineService>(WorkflowEngineService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('transition', () => {
        it('should call service.transitionStep with actorId from req', async () => {
            const dto = { ticketId: 1, transitionKeyOrStepId: 'NEXT' };
            const req = { user: { id: 99 } };

            await controller.transition(dto as any, req);

            expect(service.transitionStep).toHaveBeenCalledWith({
                ...dto,
                actorId: 99,
            });
        });
    });

    describe('checkStartFlow', () => {
        it('should calls service.checkStartFlow', async () => {
            await controller.checkStartFlow(5);
            expect(service.checkStartFlow).toHaveBeenCalledWith(5);
        });
    });

    describe('approveFlow', () => {
        it('should call service.approveFlow with user id', async () => {
            const req = { user: { id: 50 } };
            await controller.approveFlow(100, req);

            expect(service.approveFlow).toHaveBeenCalledWith(100, 50);
        });
    });
});
