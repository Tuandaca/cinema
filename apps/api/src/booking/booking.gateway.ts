import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger, UseGuards } from "@nestjs/common";
import { BookingService } from "./booking.service";
import { WsJwtGuard } from "../auth/guards/ws-jwt.guard";

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  "http://localhost:3005",
  "http://127.0.0.1:3005",
  "http://localhost:3006",
  "http://127.0.0.1:3006",
];

@WebSocketGateway({
  cors: {
    origin: (
      origin: string,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`WebSocket CORS blocked: ${origin}`));
      }
    },
    credentials: true,
  },
  namespace: "/booking",
})
export class BookingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger("BookingGateway");
  private socketToUser: Map<string, string> = new Map();
  private userSockets: Map<string, Set<string>> = new Map();

  constructor(private bookingService: BookingService) {}

  private trackUserSocket(socketId: string, userId: string) {
    this.socketToUser.set(socketId, userId);
    let sockets = this.userSockets.get(userId);
    if (!sockets) {
      sockets = new Set<string>();
      this.userSockets.set(userId, sockets);
    }
    sockets.add(socketId);
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const userId = this.socketToUser.get(client.id);
    if (userId) {
      this.socketToUser.delete(client.id);

      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
          this.logger.log(
            `User ${userId} has no more active connections. Releasing locks.`,
          );
          const released = await this.bookingService.releaseAllUserLocks(userId);
          if (this.server) {
            for (const item of released) {
              this.server.to(item.showtimeId).emit("seat_deselected", {
                seatId: item.seatId,
                userId,
              });
            }
            this.server.emit("user_disconnected", { userId });
          }
        } else {
          this.logger.log(
            `User ${userId} still has ${sockets.size} active connections. Keeping locks.`,
          );
        }
      }
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage("join_showtime")
  handleJoinShowtime(
    @MessageBody() data: { showtimeId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (
      !data?.showtimeId ||
      typeof data.showtimeId !== "string" ||
      data.showtimeId.trim() === ""
    ) {
      return { event: "error", data: "Invalid showtimeId" };
    }

    // userId comes from verified JWT, NOT from client payload
    const userId: string = (client as any).data?.user?.sub;
    if (!userId) return { event: "error", data: "Unauthorized" };

    client.join(data.showtimeId);
    this.trackUserSocket(client.id, userId);

    this.logger.log(
      `Client ${client.id} (User: ${userId}) joined showtime ${data.showtimeId}`,
    );
    return { event: "joined", data: data.showtimeId };
  }

  @SubscribeMessage("leave_showtime")
  async handleLeaveShowtime(
    @MessageBody() data: { showtimeId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (
      !data?.showtimeId ||
      typeof data.showtimeId !== "string" ||
      data.showtimeId.trim() === ""
    ) {
      return;
    }
    const cleanShowtimeId = data.showtimeId.trim();
    client.leave(cleanShowtimeId);
    this.logger.log(`Client ${client.id} left showtime ${cleanShowtimeId}`);

    const userId: string =
      (client as any).data?.user?.sub || this.socketToUser.get(client.id);
    if (userId) {
      const releasedSeats =
        await this.bookingService.releaseUserShowtimeSoftLocks(
          cleanShowtimeId,
          userId,
        );
      if (releasedSeats.length > 0 && this.server) {
        for (const seatId of releasedSeats) {
          this.server.to(cleanShowtimeId).emit("seat_deselected", {
            seatId,
            userId,
          });
        }
      }
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage("select_seat")
  async handleSelectSeat(
    @MessageBody() data: { showtimeId: string; seatId: string },
    @ConnectedSocket() client: Socket,
  ) {
    // userId is extracted from verified JWT — client cannot spoof it
    const userId: string = (client as any).data?.user?.sub;
    if (!userId) {
      client.emit("select_seat_failed", { ...data, reason: "Unauthorized" });
      return;
    }

    if (
      !data?.showtimeId ||
      !data?.seatId ||
      typeof data.showtimeId !== "string" ||
      typeof data.seatId !== "string" ||
      data.showtimeId.trim() === "" ||
      data.seatId.trim() === ""
    ) {
      client.emit("select_seat_failed", { ...data, reason: "Invalid input" });
      return;
    }

    this.trackUserSocket(client.id, userId);

    this.logger.log(
      `User ${userId} attempting to soft-lock seat ${data.seatId} for showtime ${data.showtimeId}`,
    );

    const success = await this.bookingService.softLockSeat(
      data.showtimeId,
      data.seatId,
      userId,
    );

    if (success) {
      client.to(data.showtimeId).emit("seat_selecting", {
        seatId: data.seatId,
        userId,
      });
      client.emit("select_seat_success", { ...data, userId });
    } else {
      client.emit("select_seat_failed", { ...data, userId });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage("deselect_seat")
  async handleDeselectSeat(
    @MessageBody() data: { showtimeId: string; seatId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId: string = (client as any).data?.user?.sub;
    if (!userId) return;

    if (
      !data?.showtimeId ||
      !data?.seatId ||
      typeof data.showtimeId !== "string" ||
      typeof data.seatId !== "string" ||
      data.showtimeId.trim() === "" ||
      data.seatId.trim() === ""
    ) {
      return;
    }

    this.logger.log(
      `User ${userId} releasing soft-lock on seat ${data.seatId} for showtime ${data.showtimeId}`,
    );
    await this.bookingService.releaseSoftLockSeat(
      data.showtimeId,
      data.seatId,
      userId,
    );
    client.to(data.showtimeId).emit("seat_deselected", {
      seatId: data.seatId,
      userId,
    });
  }

  // Called after successful REST /api/showtimes/:id/lock to notify clients to update UI
  notifySeatsLocked(showtimeId: string, seatIds: string[], userId: string) {
    if (this.server) {
      this.server.to(showtimeId).emit("seats_locked", {
        seatIds,
        userId,
      });
    }
  }
}
