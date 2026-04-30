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

  constructor(private bookingService: BookingService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // We could clean up locks here if we track them by socketId, 
    // but we use Redis TTL and userId, so it's handled.
  }

  @SubscribeMessage('join_showtime')
  handleJoinShowtime(
    @MessageBody() data: { showtimeId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.showtimeId);
    this.logger.log(`Client ${client.id} joined showtime ${data.showtimeId}`);
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
