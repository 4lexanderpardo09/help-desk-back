import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowController } from './workflow.controller';
import { WorkflowEngineService } from '../services/workflow-engine.service';
import { JwtAuthGuard } from 'src/modules/auth/jwt.guard';
import { PoliciesGuard } from 'src/common/guards/policies.guard';
import { ExecutionContext } from '@nestjs/common';

const mockWorkflowService = {
    transitionStep: jest.fn(),
};

describe('WorkflowController', () => {
    let controller: WorkflowController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [WorkflowController],
            providers: [
                { provide: WorkflowEngineService, useValue: mockWorkflowService },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .overrideGuard(PoliciesGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<WorkflowController>(WorkflowController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should call transitionStep', async () => {
        const dto = { ticketId: 1, transitionKeyOrStepId: 'Next' };
        const req = { user: { id: 10 } };
        await controller.transition(dto as any, req);
        expect(mockWorkflowService.transitionStep).toHaveBeenCalledWith(expect.objectContaining({ actorId: 10 }));
    });
});
