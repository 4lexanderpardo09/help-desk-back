import { Test, TestingModule } from '@nestjs/testing';
import { TicketController } from './ticket.controller';
import { TicketService } from '../services/ticket.service';
import { JwtAuthGuard } from 'src/modules/auth/jwt.guard';
import { PoliciesGuard } from 'src/common/guards/policies.guard';

const mockTicketService = {
    create: jest.fn(),
    update: jest.fn(),
    findOne: jest.fn(),
};

describe('TicketController', () => {
    let controller: TicketController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [TicketController],
            providers: [
                { provide: TicketService, useValue: mockTicketService },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .overrideGuard(PoliciesGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<TicketController>(TicketController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should call create', async () => {
        await controller.create({ usuarioId: 1 } as any);
        expect(mockTicketService.create).toHaveBeenCalled();
    });
});
