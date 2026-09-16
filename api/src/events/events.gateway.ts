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

  /**
   * Handles the connection of a new WebSocket client.
   * 
   * @param client - The connected WebSocket client, represented by a Socket instance. This client is expected to provide a JWT token in the handshake authentication data for validation.
   */
  async handleConnection(client: Socket) {
    try {
      // Validate the JWT token provided by the client during WS handshake authentication. If the token is invalid or missing, the client will be disconnected.
      const token = client.handshake.auth?.token;
      if (!token) {
        client.disconnect();
        return;
      }

      // Verify JWT token and extract user id from payload
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });

      // Store the user ID in the client object for future reference and join the client to a room named after their user ID for targeted event emissions
      client.data.userId = payload.sub;
      await client.join(payload.sub);
      console.log(
        `Client connected and joined room: ${client.id} -> ${payload.sub}`,
      );
    } catch (error) {
      console.log(`Connection rejected for ${client.id}: Invalid token`);
      client.disconnect();
    }
  }

  /**
   * Emits a real-time event to a specific user identified by their user ID. The event is sent to the room associated with the user's ID, allowing for targeted notifications or updates.
   * 
   * @param userId - The ID of the user to whom the event should be emitted. This ID is used to identify the room that the user has joined during their WebSocket connection. 
   * @param event - The name of the event to be emitted. This is a string that identifies the type of event being sent, allowing the client to handle it appropriately.
   * @param payload - An optional object containing additional data to be sent with the event. This can include any relevant information that the client may need to process the event, such as updated data or status messages.
   */
  emitToUser(userId: string, event: string, payload?: any) {
    if (this.server) {
      this.server.to(userId).emit(event, payload);
    }
  }

  /**
   * Broadcasts a real-time event to all connected WebSocket clients. This method is useful for sending global notifications or updates that are relevant to all users, regardless of their individual user IDs.
   * 
   * @param event - The name of the event to be broadcasted. This is a string that identifies the type of event being sent, allowing all connected clients to handle it appropriately.
   * @param payload - An optional object containing additional data to be sent with the event. This can include any relevant information that the client may need to process the event, such as updated data or status messages.
   */
  broadcast(event: string, payload?: any) {
    if (this.server) {
      this.server.emit(event, payload);
    }
  }
}
