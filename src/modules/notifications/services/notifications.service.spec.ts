import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { InAppNotificationsService } from './in-app-notifications.service';
import { EmailService } from './email.service';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { User } from '../../users/entities/user.entity';

describe('NotificationsService', () => {
    let service: NotificationsService;
    let inAppService: InAppNotificationsService;
    let emailService: EmailService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationsService,
                {
                    provide: InAppNotificationsService,
                    useValue: { create: jest.fn() }
                },
                {
                    provide: EmailService,
                    useValue: { sendAssignmentNotification: jest.fn() }
                }
            ],
        }).compile();

        service = module.get<NotificationsService>(NotificationsService);
        inAppService = module.get<InAppNotificationsService>(InAppNotificationsService);
        emailService = module.get<EmailService>(EmailService);
    });

    it('should notify assignment via DB and Email', async () => {
        const ticket = { id: 1, titulo: 'Test Ticket' } as Ticket;
        const user = { id: 5, nombre: 'Juan', email: 'juan@test.com' } as User;

        await service.notifyAssignment(ticket, user);

        expect(inAppService.create).toHaveBeenCalledWith(5, 1, expect.stringContaining('Se te ha asignado'));
        expect(emailService.sendAssignmentNotification).toHaveBeenCalledWith('juan@test.com', expect.anything());
    });

    it('should skip email if user has no email', async () => {
        const ticket = { id: 1, titulo: 'Test Ticket' } as Ticket;
        const user = { id: 5, nombre: 'Juan', correo: null } as unknown as User;

        await service.notifyAssignment(ticket, user);

        expect(inAppService.create).toHaveBeenCalled();
        expect(emailService.sendAssignmentNotification).not.toHaveBeenCalled();
    });
});
