import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

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

  handleConnection(client: Socket) {
    console.log(`Client connected to WS: ${client.id}`);
  }

  @SubscribeMessage('joinUserRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody('userId') userId: string,
  ) {
    await client.join(userId);
    console.log(`Client ${client.id} joined room of user: ${userId}`);
  }
}
