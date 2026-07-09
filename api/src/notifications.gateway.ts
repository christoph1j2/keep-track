import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

// Povolíme CORS, aby se React mohl připojit
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection {
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
}
