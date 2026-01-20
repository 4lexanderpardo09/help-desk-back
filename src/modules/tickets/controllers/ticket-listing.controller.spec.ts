import { Test, TestingModule } from '@nestjs/testing';
import { TicketListingController } from './ticket-listing.controller';
import { TicketListingService } from '../services/ticket-listing.service';
import { TicketFilterDto } from '../dto/ticket-filter.dto';
import { CanActivate } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/jwt.guard';
import { PoliciesGuard } from '../../../common/guards/policies.guard';

describe('TicketListingController', () => {
    let controller: TicketListingController;
    let service: TicketListingService;

    const mockTicketListingService = {
        listTicketsByUser: jest.fn(),
        listTicketsByAgent: jest.fn(),
        listAllTickets: jest.fn(),
        listTicketsObservados: jest.fn(),
    };

    const mockGuard: CanActivate = { canActivate: jest.fn(() => true) };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [TicketListingController],
            providers: [
                {
                    provide: TicketListingService,
                    useValue: mockTicketListingService,
                },
            ],
        })
            .overrideGuard(JwtAuthGuard).useValue(mockGuard)
            .overrideGuard(PoliciesGuard).useValue(mockGuard)
            .compile();

        controller = module.get<TicketListingController>(TicketListingController);
        service = module.get<TicketListingService>(TicketListingService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('listByUser', () => {
        it('should call service.listTicketsByUser', async () => {
            const req = { user: { id: 1 } };
            const filters: TicketFilterDto = { page: 1, limit: 10 };
            await controller.listByUser(req as any, filters);
            expect(service.listTicketsByUser).toHaveBeenCalledWith(1, filters);
        });
    });

    describe('listByAgent', () => {
        it('should call service.listTicketsByAgent', async () => {
            const req = { user: { id: 2 } };
            const filters: TicketFilterDto = { page: 1, limit: 10 };
            await controller.listByAgent(req as any, filters);
            expect(service.listTicketsByAgent).toHaveBeenCalledWith(2, filters);
        });
    });

    describe('listAll', () => {
        it('should call service.listAllTickets', async () => {
            const filters: TicketFilterDto = { page: 1, limit: 10 };
            await controller.listAll(filters);
            expect(service.listAllTickets).toHaveBeenCalledWith(filters);
        });
    });
});
