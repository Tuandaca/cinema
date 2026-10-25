import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  Optional,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";

export interface SeatStatus {
  id: string;
  row: string;
  number: number;
  type: string;
  status: "AVAILABLE" | "SELECTING" | "LOCKED" | "BOOKED";
  lockedBy?: string;
}

export interface ReleasedLockInfo {
  showtimeId: string;
  seatId: string;
  type: "lock" | "softlock";
}

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);
  // 5 minutes lock
  private readonly LOCK_TTL = 300;

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly redisService: RedisService = new RedisService(),
  ) {}

  async getShowtimeDetails(showtimeId: string) {
    const showtime = await this.prisma.showtime.findUnique({
      where: { id: showtimeId },
      include: {
        movie: true,
        room: true,
      },
    });

    if (!showtime) {
      throw new BadRequestException("Showtime not found");
    }

    return showtime;
  }

  async getSeatsStatus(showtimeId: string): Promise<SeatStatus[]> {
    const showtime = await this.prisma.showtime.findUnique({
      where: { id: showtimeId },
      include: {
        room: {
          include: {
            seats: true,
          },
        },
      },
    });

    if (!showtime) {
      throw new BadRequestException("Showtime not found");
    }

    // Get booked seats from DB (status PAID or active PENDING within 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const bookings = await this.prisma.booking.findMany({
      where: {
        showtimeId,
        OR: [
          { status: "PAID" },
          { status: "PENDING", createdAt: { gte: tenMinutesAgo } },
        ],
      },
      include: {
        seats: true,
      },
    });

    const bookedSeatIds = new Set<string>();
    bookings.forEach((b) => {
      b.seats.forEach((s) => bookedSeatIds.add(s.seatId));
    });

    // Get hard-locked and soft-locked seats from Redis / In-memory fallback
    const lockedSeats = new Map<string, string>(); // seatId -> userId
    const softLockedSeats = new Map<string, string>(); // seatId -> userId

    try {
      const lockPrefix = `lock:${showtimeId}:`;
      const lockKeys = await this.redisService.getKeysByPattern(`${lockPrefix}*`);

      if (lockKeys.length > 0) {
        const values = await this.redisService.mget(lockKeys);
        lockKeys.forEach((key, index) => {
          const seatId = key.substring(lockPrefix.length);
          const userId = values[index];
          if (userId) {
            lockedSeats.set(seatId, userId);
          }
        });
      }

      const softLockPrefix = `softlock:${showtimeId}:`;
      const softLockKeys =
        await this.redisService.getKeysByPattern(`${softLockPrefix}*`);

      if (softLockKeys.length > 0) {
        const values = await this.redisService.mget(softLockKeys);
        softLockKeys.forEach((key, index) => {
          const seatId = key.substring(softLockPrefix.length);
          const userId = values[index];
          if (userId) {
            softLockedSeats.set(seatId, userId);
          }
        });
      }
    } catch (err: any) {
      this.logger.warn(
        `Failed to fetch seat locks for showtime ${showtimeId}: ${err.message}`,
      );
    }

    const roomSeats = showtime.room?.seats || [];
    return roomSeats.map((seat) => {
      let status: "AVAILABLE" | "SELECTING" | "LOCKED" | "BOOKED" = "AVAILABLE";
      let lockedBy = undefined;

      if (bookedSeatIds.has(seat.id)) {
        status = "BOOKED";
      } else if (lockedSeats.has(seat.id)) {
        status = "LOCKED";
        lockedBy = lockedSeats.get(seat.id);
      } else if (softLockedSeats.has(seat.id)) {
        status = "SELECTING";
        lockedBy = softLockedSeats.get(seat.id);
      }

      return {
        id: seat.id,
        row: seat.row,
        number: seat.number,
        type: seat.type,
        status,
        lockedBy,
      };
    });
  }

  private validateSeatIds(seatIds: string[]): string[] {
    if (!Array.isArray(seatIds) || seatIds.length === 0) {
      throw new BadRequestException("Vui lòng chọn ít nhất một ghế.");
    }
    for (const id of seatIds) {
      if (!id || typeof id !== "string" || id.trim() === "") {
        throw new BadRequestException("Mã ghế không hợp lệ.");
      }
    }
    const uniqueSeatIds = Array.from(new Set(seatIds));
    if (uniqueSeatIds.length !== seatIds.length) {
      throw new BadRequestException("Danh sách ghế không được trùng lặp.");
    }
    return uniqueSeatIds;
  }

  async lockSeats(
    showtimeId: string,
    seatIds: string[],
    userId: string,
  ): Promise<boolean> {
    const validSeatIds = this.validateSeatIds(seatIds);

    // 1. Check if seats are already booked in DB (PAID or active PENDING within 10m)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const existingBookings = await this.prisma.bookingSeat.findFirst({
      where: {
        seatId: { in: validSeatIds },
        booking: {
          showtimeId,
          OR: [
            { status: "PAID" },
            { status: "PENDING", createdAt: { gte: tenMinutesAgo } },
          ],
        },
      },
    });

    if (existingBookings) {
      throw new BadRequestException(
        "Một hoặc nhiều ghế đã được đặt hoặc đang thanh toán.",
      );
    }

    // 2. Atomically lock in Redis / In-memory fallback (verifies neither hard nor soft lock is held by another user)
    const acquired = await this.redisService.acquireSeatLocks(
      showtimeId,
      validSeatIds,
      userId,
      this.LOCK_TTL,
    );

    if (!acquired) {
      throw new BadRequestException("Ghế đang được người khác giữ.");
    }

    return true;
  }

  async releaseLocks(
    showtimeId: string,
    seatIds: string[],
    userId: string,
  ): Promise<void> {
    if (!seatIds || seatIds.length === 0) return;
    const lockKeys = seatIds.map((id) => `lock:${showtimeId}:${id}`);
    const softLockKeys = seatIds.map((id) => `softlock:${showtimeId}:${id}`);
    await this.redisService.releaseLocks([...lockKeys, ...softLockKeys], userId);
  }

  async releaseAllUserLocks(userId: string): Promise<ReleasedLockInfo[]> {
    const released: ReleasedLockInfo[] = [];
    try {
      const lockKeys = await this.redisService.getKeysByPattern("lock:*:*");
      const softLockKeys =
        await this.redisService.getKeysByPattern("softlock:*:*");
      const allKeys = [...lockKeys, ...softLockKeys];

      if (allKeys.length === 0) return [];

      const values = await this.redisService.mget(allKeys);

      for (let i = 0; i < allKeys.length; i++) {
        if (values[i] === userId) {
          const key = allKeys[i];
          const ok = await this.redisService.releaseLock(key, userId);
          if (ok) {
            const isLock = key.startsWith("lock:");
            const prefix = isLock ? "lock:" : "softlock:";
            const rest = key.substring(prefix.length);
            const colonIdx = rest.indexOf(":");
            if (colonIdx !== -1) {
              const showtimeId = rest.substring(0, colonIdx);
              const seatId = rest.substring(colonIdx + 1);
              released.push({
                showtimeId,
                seatId,
                type: isLock ? "lock" : "softlock",
              });
            }
          }
        }
      }
      this.logger.log(`Released ${released.length} locks for user: ${userId}`);
    } catch (err: any) {
      this.logger.warn(`Redis releaseAllUserLocks error: ${err.message}`);
    }
    return released;
  }

  // --- TWO-PHASE LOCKING: SOFT-LOCKS ---

  async softLockSeat(
    showtimeId: string,
    seatId: string,
    userId: string,
  ): Promise<boolean> {
    const softKey = `softlock:${showtimeId}:${seatId}`;
    const hardKey = `lock:${showtimeId}:${seatId}`;

    return this.redisService.acquireSoftLock(
      softKey,
      hardKey,
      userId,
      this.LOCK_TTL,
    );
  }

  async releaseSoftLockSeat(
    showtimeId: string,
    seatId: string,
    userId: string,
  ): Promise<void> {
    const softKey = `softlock:${showtimeId}:${seatId}`;
    await this.redisService.releaseLock(softKey, userId);
  }

  async releaseUserShowtimeSoftLocks(
    showtimeId: string,
    userId: string,
  ): Promise<string[]> {
    const releasedSeatIds: string[] = [];
    try {
      const softLockPrefix = `softlock:${showtimeId}:`;
      const keys = await this.redisService.getKeysByPattern(`${softLockPrefix}*`);
      if (keys.length === 0) return [];

      const values = await this.redisService.mget(keys);
      for (let i = 0; i < keys.length; i++) {
        if (values[i] === userId) {
          const key = keys[i];
          const ok = await this.redisService.releaseLock(key, userId);
          if (ok) {
            const seatId = key.substring(softLockPrefix.length);
            releasedSeatIds.push(seatId);
          }
        }
      }
    } catch (err: any) {
      this.logger.warn(
        `Failed to release showtime soft-locks for user ${userId}: ${err.message}`,
      );
    }
    return releasedSeatIds;
  }

  // --- ORDER CREATION ---

  async createBooking(
    userId: string,
    showtimeId: string,
    seatIds: string[],
    combos: { comboId: string; quantity: number }[],
  ) {
    const validSeatIds = this.validateSeatIds(seatIds);

    // Validate user existence — NO fallback to prevent unauthorized bookings
    const userExists = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!userExists) {
      throw new UnauthorizedException("Invalid user. Please log in again.");
    }

    const showtime = await this.prisma.showtime.findUnique({
      where: { id: showtimeId },
    });

    if (!showtime) throw new BadRequestException("Showtime not found");

    // Atomically acquire seat locks to prevent race conditions during booking creation.
    // If seats were already held/soft-locked by this user, this locks them and clears soft-locks.
    // If any seat is held by another user, acquireSeatLocks atomically returns false.
    const acquired = await this.redisService.acquireSeatLocks(
      showtimeId,
      validSeatIds,
      userId,
      this.LOCK_TTL,
    );

    if (!acquired) {
      throw new BadRequestException(
        "Một hoặc nhiều ghế đang được giữ bởi người khác. Vui lòng chọn ghế khác.",
      );
    }

    // Fetch seat details to calculate correct price per seat type
    const seats = await this.prisma.seat.findMany({
      where: { id: { in: validSeatIds } },
    });

    if (seats.length !== validSeatIds.length) {
      await this.releaseLocks(showtimeId, validSeatIds, userId);
      throw new BadRequestException("Một hoặc nhiều ghế không tồn tại.");
    }

    // Double-booking prevention at DB level
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const conflictBooking = await this.prisma.bookingSeat.findFirst({
      where: {
        seatId: { in: validSeatIds },
        booking: {
          showtimeId,
          OR: [
            { status: "PAID" },
            { status: "PENDING", createdAt: { gte: tenMinutesAgo } },
          ],
        },
      },
      include: {
        seat: true,
      },
    });

    if (conflictBooking) {
      await this.releaseLocks(showtimeId, validSeatIds, userId);
      throw new BadRequestException(
        `Ghế ${conflictBooking.seat.row}${conflictBooking.seat.number} đã được đặt hoặc đang trong quá trình thanh toán bởi người khác.`,
      );
    }

    let totalAmount = 0;
    const seatPriceMap = new Map<string, number>();

    // Calculate seats price with type multiplier
    for (const seat of seats) {
      const basePrice = showtime.priceBase;
      let multiplier = 1.0;
      if (seat.type === "VIP") multiplier = 1.5;
      else if (seat.type === "SWEETBOX") multiplier = 2.0;
      const seatPrice = Math.round(basePrice * multiplier);
      seatPriceMap.set(seat.id, seatPrice);
      totalAmount += seatPrice;
    }

    // Calculate combos price
    const orderItemsData = [];
    if (combos && combos.length > 0) {
      for (const item of combos) {
        const combo = await this.prisma.combo.findUnique({
          where: { id: item.comboId },
        });
        if (combo) {
          totalAmount += combo.price * item.quantity;
          orderItemsData.push({
            comboId: item.comboId,
            quantity: item.quantity,
          });
        }
      }
    }

    // Create DB Booking
    const booking = await this.prisma.booking.create({
      data: {
        userId: userId,
        showtimeId,
        status: "PENDING",
        totalAmount,
        seats: {
          create: validSeatIds.map((seatId) => ({
            seatId,
            price: seatPriceMap.get(seatId) || showtime.priceBase,
          })),
        },
        orderItems: {
          create: orderItemsData,
        },
      },
    });

    // RELEASE REDIS LOCKS IMMEDIATELY after successful DB creation
    try {
      await this.releaseLocks(showtimeId, validSeatIds, userId);
      this.logger.log(
        `Released locks for seats ${validSeatIds.join(", ")} after booking ${booking.id}`,
      );
    } catch (err: any) {
      this.logger.error(
        `Failed to release locks after booking: ${err.message}`,
      );
    }

    return booking;
  }

  async getBookingById(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        showtime: {
          include: {
            movie: true,
            room: true,
          },
        },
        seats: {
          include: {
            seat: true,
          },
        },
        orderItems: {
          include: {
            combo: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    if (booking.userId !== userId) {
      throw new ForbiddenException(
        "Access denied: You do not own this booking",
      );
    }

    return booking;
  }
}
