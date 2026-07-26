import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });

      client.data.userId = payload.sub;
      await client.join(payload.sub);
      console.log(`Client connected and joined room: ${client.id} -> ${payload.sub}`);
    } catch (error) {
      console.log(`Connection rejected for ${client.id}: Invalid token`);
      client.disconnect();
    }
  }

  /**
   * Emits a real-time event to a specific user's connected room.
   */
  emitToUser(userId: string, event: string, payload?: any) {
    if (this.server) {
      this.server.to(userId).emit(event, payload);
    }
  }

  /**
   * Emits a real-time event to all connected clients.
   */
  broadcast(event: string, payload?: any) {
    if (this.server) {
      this.server.emit(event, payload);
    }
  }
}
