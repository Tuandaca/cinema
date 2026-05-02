import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Redis from 'ioredis';

export interface SeatStatus {
  id: string;
  row: string;
  number: number;
  type: string;
  status: 'AVAILABLE' | 'LOCKED' | 'BOOKED';
  lockedBy?: string;
}

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);
  private readonly redis: Redis;

  constructor(private prisma: PrismaService) {
    const redisUrl = process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL || 'redis://localhost:6379';
    this.redis = new Redis(redisUrl);
    this.redis.on('error', (err) => this.logger.error('Redis Client Error', err));
    this.redis.on('connect', () => this.logger.log('Connected to Redis'));
  }

  // 5 minutes lock
  private readonly LOCK_TTL = 300;

  async getShowtimeDetails(showtimeId: string) {
    const showtime = await this.prisma.showtime.findUnique({
      where: { id: showtimeId },
      include: {
        movie: true,
        room: true,
      },
    });

    if (!showtime) {
      throw new BadRequestException('Showtime not found');
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
      throw new BadRequestException('Showtime not found');
    }

    // Get booked seats from DB (status PAID or PENDING maybe? Let's check PAID)
    // Actually, PENDING might also be in DB if we want, but for now we rely on Redis for temporary locks.
    // Let's assume BookingStatus PAID means booked permanently.
    const bookings = await this.prisma.booking.findMany({
      where: {
        showtimeId,
        status: { in: ['PAID', 'PENDING'] }, // PENDING could be mid-payment
      },
      include: {
        seats: true,
      },
    });

    const bookedSeatIds = new Set<string>();
    bookings.forEach((b) => {
      b.seats.forEach((s) => bookedSeatIds.add(s.seatId));
    });

    // Get locked seats from Redis
    const lockKeysPattern = `lock:${showtimeId}:*`;
    const keys = await this.redis.keys(lockKeysPattern);
    
    const lockedSeats = new Map<string, string>(); // seatId -> userId
    if (keys.length > 0) {
      const values = await this.redis.mget(keys);
      keys.forEach((key, index) => {
        const parts = key.split(':');
        const seatId = parts[2];
        const userId = values[index];
        if (userId) {
          lockedSeats.set(seatId, userId);
        }
      });
    }

    return showtime.room.seats.map((seat) => {
      let status: 'AVAILABLE' | 'LOCKED' | 'BOOKED' = 'AVAILABLE';
      let lockedBy = undefined;

      if (bookedSeatIds.has(seat.id)) {
        status = 'BOOKED';
      } else if (lockedSeats.has(seat.id)) {
        status = 'LOCKED';
        lockedBy = lockedSeats.get(seat.id);
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

  async lockSeats(showtimeId: string, seatIds: string[], userId: string): Promise<boolean> {
    // 1. Check if seats are already booked in DB
    const existingBookings = await this.prisma.bookingSeat.findFirst({
      where: {
        seatId: { in: seatIds },
        booking: {
          showtimeId,
          status: { in: ['PAID', 'PENDING'] }
        }
      }
    });

    if (existingBookings) {
      throw new BadRequestException('Một hoặc nhiều ghế đã được đặt.');
    }

    // 2. Try to lock in Redis using SETNX or a pipeline
    const pipeline = this.redis.pipeline();
    const lockKeys = seatIds.map(id => `lock:${showtimeId}:${id}`);

    // We can't easily check all locks atomically without Lua, but let's try a simple approach
    // We will use MSETNX if possible, but Redis MSETNX doesn't support TTL.
    // Better to use Lua script for atomic multi-lock
    const script = `
      local keys = KEYS
      local userId = ARGV[1]
      local ttl = ARGV[2]

      -- Check if any key exists
      for i, key in ipairs(keys) do
        if redis.call("EXISTS", key) == 1 then
          -- Wait, we should allow re-locking by the same user to extend TTL
          local currentOwner = redis.call("GET", key)
          if currentOwner ~= userId then
            return 0 -- Failed to acquire all locks
          end
        end
      end

      -- Set all locks
      for i, key in ipairs(keys) do
        redis.call("SET", key, userId, "EX", ttl)
      end

      return 1 -- Success
    `;

    const result = await this.redis.eval(
      script,
      lockKeys.length,
      ...lockKeys,
      userId,
      this.LOCK_TTL
    );

    if (result === 0) {
      throw new BadRequestException('Ghế đang được người khác giữ.');
    }

    return true;
  }

  async releaseLocks(showtimeId: string, seatIds: string[], userId: string): Promise<void> {
    const lockKeys = seatIds.map(id => `lock:${showtimeId}:${id}`);
    
    // Only release if the current owner is the user
    const script = `
      local keys = KEYS
      local userId = ARGV[1]

      for i, key in ipairs(keys) do
        local currentOwner = redis.call("GET", key)
        if currentOwner == userId then
          redis.call("DEL", key)
        end
      end
      return 1
    `;

    await this.redis.eval(script, lockKeys.length, ...lockKeys, userId);
  }

  async releaseAllUserLocks(userId: string): Promise<void> {
    const keys = await this.redis.keys('lock:*:*');
    if (keys.length === 0) return;

    const pipeline = this.redis.pipeline();
    const values = await this.redis.mget(keys);

    keys.forEach((key, index) => {
      if (values[index] === userId) {
        pipeline.del(key);
      }
    });

    await pipeline.exec();
    this.logger.log(`Released all locks for user: ${userId}`);
  }
}
