import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable, Logger } from '@nestjs/common';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@WebSocketGateway({
    cors: {
        origin: '*', // Adjust for production
    },
    namespace: 'notifications'
})
@Injectable()
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(NotificationsGateway.name);

    constructor(private readonly jwtService: JwtService) { }

    afterInit(server: Server) {
        this.logger.log('WebSocket Gateway Initialized');
    }

    /**
     * Handles new WebSocket connections.
     * Authenticates the user via JWT from Authorization header or 'token' query param.
     * Joins the user to a private room 'user_{id}' for targeted notifications.
     * 
     * @param client - The socket client instance
     */
    async handleConnection(client: Socket) {
        try {
            // 1. Get Token from Query Param or Header
            const token = this.extractToken(client);

            if (!token) {
                this.logger.warn(`Connection attempt without token: ${client.id}`);
                client.disconnect();
                return;
            }

            // 2. Verify Token
            const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

            // 3. Join user to their private room: user_<id>
            const roomName = `user_${payload.usu_id}`;
            await client.join(roomName);

            // Store user info in socket data if needed
            client.data.user = payload;

            this.logger.log(`Client connected: ${client.id}, User ID: ${payload.usu_id}, Room: ${roomName}`);

        } catch (error) {
            this.logger.error(`Connection failed: ${error.message}`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    /**
     * Emits an event to a specific user's private room.
     * 
     * @param userId - The recipient user ID
     * @param event - The event name (e.g., 'new_notification')
     * @param payload - Data to send with the event
     */
    emitToUser(userId: number, event: string, payload: any) {
        const roomName = `user_${userId}`;
        this.server.to(roomName).emit(event, payload);
    }

    private extractToken(client: Socket): string | undefined {
        // Try Authorization header first
        const authHeader = client.handshake.headers.authorization;
        if (authHeader && authHeader.split(' ')[0] === 'Bearer') {
            return authHeader.split(' ')[1];
        }

        // Try 'token' query param as fallback
        const token = client.handshake.auth?.token || client.handshake.query?.token;
        return token;
    }
}
