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
import { Logger, UseGuards } from '@nestjs/common';
import { BookingService } from './booking.service';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
];

@WebSocketGateway({
  cors: {
    origin: (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`WebSocket CORS blocked: ${origin}`));
      }
    },
    credentials: true,
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

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join_showtime')
  handleJoinShowtime(
    @MessageBody() data: { showtimeId: string },
    @ConnectedSocket() client: Socket,
  ) {
    // userId comes from verified JWT, NOT from client payload
    const userId: string = (client as any).data?.user?.sub;
    if (!userId) return { event: 'error', data: 'Unauthorized' };

    client.join(data.showtimeId);
    this.socketToUser.set(client.id, userId);
    const count = this.userToSocketCount.get(userId) || 0;
    this.userToSocketCount.set(userId, count + 1);

    this.logger.log(`Client ${client.id} (User: ${userId}) joined showtime ${data.showtimeId}`);
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

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('select_seat')
  async handleSelectSeat(
    @MessageBody() data: { showtimeId: string; seatId: string },
    @ConnectedSocket() client: Socket,
  ) {
    // userId is extracted from verified JWT — client cannot spoof it
    const userId: string = (client as any).data?.user?.sub;
    if (!userId) {
      client.emit('select_seat_failed', { ...data, reason: 'Unauthorized' });
      return;
    }

    this.logger.log(`User ${userId} attempting to soft-lock seat ${data.seatId} for showtime ${data.showtimeId}`);

    const success = await this.bookingService.softLockSeat(data.showtimeId, data.seatId, userId);

    if (success) {
      client.to(data.showtimeId).emit('seat_selecting', {
        seatId: data.seatId,
        userId,
      });
      client.emit('select_seat_success', { ...data, userId });
    } else {
      client.emit('select_seat_failed', { ...data, userId });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('deselect_seat')
  async handleDeselectSeat(
    @MessageBody() data: { showtimeId: string; seatId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId: string = (client as any).data?.user?.sub;
    if (!userId) return;

    this.logger.log(`User ${userId} releasing soft-lock on seat ${data.seatId} for showtime ${data.showtimeId}`);
    await this.bookingService.releaseSoftLockSeat(data.showtimeId, data.seatId, userId);
    client.to(data.showtimeId).emit('seat_deselected', {
      seatId: data.seatId,
      userId,
    });
  }

  // Called after successful REST /api/showtimes/:id/lock to notify clients to update UI
  notifySeatsLocked(showtimeId: string, seatIds: string[], userId: string) {
    this.server.to(showtimeId).emit('seats_locked', {
      seatIds,
      userId,
    });
  }
}
