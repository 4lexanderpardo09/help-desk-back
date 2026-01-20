import { Test, TestingModule } from '@nestjs/testing';
import { TicketHistoryController } from './ticket-history.controller';
import { TicketHistoryService } from '../services/ticket-history.service';
import { CanActivate } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/jwt.guard';
import { PoliciesGuard } from '../../../common/guards/policies.guard';

describe('TicketHistoryController', () => {
    let controller: TicketHistoryController;
    let service: TicketHistoryService;

    const mockService = {
        getTicketTimeline: jest.fn().mockResolvedValue([]),
    };

    const mockGuard: CanActivate = { canActivate: jest.fn(() => true) };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [TicketHistoryController],
            providers: [
                { provide: TicketHistoryService, useValue: mockService },
            ],
        })
            .overrideGuard(JwtAuthGuard).useValue(mockGuard)
            .overrideGuard(PoliciesGuard).useValue(mockGuard)
            .compile();

        controller = module.get<TicketHistoryController>(TicketHistoryController);
        service = module.get<TicketHistoryService>(TicketHistoryService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getTimeline', () => {
        it('should call service.getTicketTimeline with correct id', async () => {
            await controller.getTimeline(123);
            expect(service.getTicketTimeline).toHaveBeenCalledWith(123);
        });
    });
});
