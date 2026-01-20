import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsGateway } from './notifications.gateway';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

describe('NotificationsGateway', () => {
    let gateway: NotificationsGateway;
    let jwtService: JwtService;

    const mockJwtService = {
        verifyAsync: jest.fn(),
    };

    const mockToken = 'valid-token';
    const mockPayload = { usu_id: 1, email: 'test@example.com' };

    const mockClient = {
        id: 'client-1',
        disconnect: jest.fn(),
        join: jest.fn(),
        handshake: {
            headers: {
                authorization: `Bearer ${mockToken}`
            },
            auth: {},
            query: {}
        },
        data: {}
    } as unknown as Socket;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationsGateway,
                { provide: JwtService, useValue: mockJwtService },
            ],
        }).compile();

        gateway = module.get<NotificationsGateway>(NotificationsGateway);
        jwtService = module.get<JwtService>(JwtService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    describe('handleConnection', () => {
        it('should join user room on valid token', async () => {
            mockJwtService.verifyAsync.mockResolvedValue(mockPayload);

            await gateway.handleConnection(mockClient);

            expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(mockToken);
            expect(mockClient.join).toHaveBeenCalledWith('user_1');
            expect(mockClient.disconnect).not.toHaveBeenCalled();
        });

        it('should disconnect on missing token', async () => {
            const clientNoToken = {
                ...mockClient,
                handshake: { headers: {}, auth: {}, query: {} }
            } as unknown as Socket;

            await gateway.handleConnection(clientNoToken);

            expect(clientNoToken.disconnect).toHaveBeenCalled();
            expect(mockJwtService.verifyAsync).not.toHaveBeenCalled();
        });

        it('should disconnect on invalid token', async () => {
            mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

            await gateway.handleConnection(mockClient);

            expect(mockClient.disconnect).toHaveBeenCalled();
        });
    });
});
