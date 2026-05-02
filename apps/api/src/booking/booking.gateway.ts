import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { BookingService } from './booking.service';

@WebSocketGateway({
  cors: {
    origin: '*', // For dev
  },
  namespace: '/booking',
})
export class BookingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('BookingGateway');
  private socketToUser: Map<string, string> = new Map();

  constructor(private bookingService: BookingService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const userId = this.socketToUser.get(client.id);
    if (userId) {
      this.socketToUser.delete(client.id);
      // Optional: Check if user has other active sockets before releasing?
      // For simplicity, we release all locks for this user.
      await this.bookingService.releaseAllUserLocks(userId);
      
      // Notify other clients in all rooms this client was in
      // Actually, we should broadcast that seats are now available
      // For now, clients will refresh status if we emit a global or room event
      this.server.emit('user_disconnected', { userId });
    }
  }

  @SubscribeMessage('join_showtime')
  handleJoinShowtime(
    @MessageBody() data: { showtimeId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.showtimeId);
    if (data.userId) {
      this.socketToUser.set(client.id, data.userId);
    }
    this.logger.log(`Client ${client.id} (User: ${data.userId}) joined showtime ${data.showtimeId}`);
    return { event: 'joined', data: data.showtimeId };
  }

  @SubscribeMessage('leave_showtime')
  handleLeaveShowtime(
    @MessageBody() data: { showtimeId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(data.showtimeId);
    this.logger.log(`Client ${client.id} left showtime ${data.showtimeId}`);
  }

  // Real-time "typing" indicator for seats
  @SubscribeMessage('select_seat')
  handleSelectSeat(
    @MessageBody() data: { showtimeId: string; seatId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`User ${data.userId} selecting seat ${data.seatId} for showtime ${data.showtimeId}`);
    // Broadcast to everyone else in the room
    client.to(data.showtimeId).emit('seat_selecting', {
      seatId: data.seatId,
      userId: data.userId,
    });
  }

  @SubscribeMessage('deselect_seat')
  handleDeselectSeat(
    @MessageBody() data: { showtimeId: string; seatId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`User ${data.userId} deselecting seat ${data.seatId} for showtime ${data.showtimeId}`);
    client.to(data.showtimeId).emit('seat_deselected', {
      seatId: data.seatId,
      userId: data.userId,
    });
  }

  // Called after successful REST /api/showtimes/:id/lock to notify clients to update UI
  // Note: Clients could just listen to this to refresh their grid
  notifySeatsLocked(showtimeId: string, seatIds: string[], userId: string) {
    this.server.to(showtimeId).emit('seats_locked', {
      seatIds,
      userId,
    });
  }
}
