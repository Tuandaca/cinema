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
  private userToSocketCount: Map<string, number> = new Map();

  constructor(private bookingService: BookingService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const userId = this.socketToUser.get(client.id);
    if (userId) {
      this.socketToUser.delete(client.id);
      
      const currentCount = this.userToSocketCount.get(userId) || 0;
      const newCount = Math.max(0, currentCount - 1);
      
      if (newCount === 0) {
        this.userToSocketCount.delete(userId);
        this.logger.log(`User ${userId} has no more active connections. Releasing locks.`);
        await this.bookingService.releaseAllUserLocks(userId);
        this.server.emit('user_disconnected', { userId });
      } else {
        this.userToSocketCount.set(userId, newCount);
        this.logger.log(`User ${userId} still has ${newCount} active connections. Keeping locks.`);
      }
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
      const count = this.userToSocketCount.get(data.userId) || 0;
      this.userToSocketCount.set(data.userId, count + 1);
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

  // Real-time "typing" indicator for seats -> Now acts as Soft-Lock
  @SubscribeMessage('select_seat')
  async handleSelectSeat(
    @MessageBody() data: { showtimeId: string; seatId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`User ${data.userId} attempting to soft-lock seat ${data.seatId} for showtime ${data.showtimeId}`);
    
    const success = await this.bookingService.softLockSeat(data.showtimeId, data.seatId, data.userId);
    
    if (success) {
      // Broadcast to everyone else in the room
      client.to(data.showtimeId).emit('seat_selecting', {
        seatId: data.seatId,
        userId: data.userId,
      });
      // Notify the sender that it succeeded
      client.emit('select_seat_success', data);
    } else {
      // Notify the sender that it failed
      client.emit('select_seat_failed', data);
    }
  }

  @SubscribeMessage('deselect_seat')
  async handleDeselectSeat(
    @MessageBody() data: { showtimeId: string; seatId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`User ${data.userId} releasing soft-lock on seat ${data.seatId} for showtime ${data.showtimeId}`);
    await this.bookingService.releaseSoftLockSeat(data.showtimeId, data.seatId, data.userId);
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
