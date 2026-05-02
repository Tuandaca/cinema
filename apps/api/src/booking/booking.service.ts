import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Redis from 'ioredis';

export interface SeatStatus {
  id: string;
  row: string;
  number: number;
  type: string;
  status: 'AVAILABLE' | 'SELECTING' | 'LOCKED' | 'BOOKED';
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

    // Get hard-locked seats from Redis
    const lockKeysPattern = `lock:${showtimeId}:*`;
    const lockKeys = await this.redis.keys(lockKeysPattern);
    const lockedSeats = new Map<string, string>(); // seatId -> userId

    if (lockKeys.length > 0) {
      const values = await this.redis.mget(lockKeys);
      lockKeys.forEach((key, index) => {
        const parts = key.split(':');
        const seatId = parts[2];
        const userId = values[index];
        if (userId) {
          lockedSeats.set(seatId, userId);
        }
      });
    }

    // Get soft-locked seats from Redis
    const softLockKeysPattern = `softlock:${showtimeId}:*`;
    const softLockKeys = await this.redis.keys(softLockKeysPattern);
    const softLockedSeats = new Map<string, string>(); // seatId -> userId

    if (softLockKeys.length > 0) {
      const values = await this.redis.mget(softLockKeys);
      softLockKeys.forEach((key, index) => {
        const parts = key.split(':');
        const seatId = parts[2];
        const userId = values[index];
        if (userId) {
          softLockedSeats.set(seatId, userId);
        }
      });
    }

    return showtime.room.seats.map((seat) => {
      let status: 'AVAILABLE' | 'SELECTING' | 'LOCKED' | 'BOOKED' = 'AVAILABLE';
      let lockedBy = undefined;

      if (bookedSeatIds.has(seat.id)) {
        status = 'BOOKED';
      } else if (lockedSeats.has(seat.id)) {
        status = 'LOCKED';
        lockedBy = lockedSeats.get(seat.id);
      } else if (softLockedSeats.has(seat.id)) {
        status = 'SELECTING';
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

    // 2. Try to lock in Redis using Lua script
    const lockKeys = seatIds.map(id => `lock:${showtimeId}:${id}`);
    const softLockKeys = seatIds.map(id => `softlock:${showtimeId}:${id}`);
    
    // Check if seats are already hard-locked by SOMEONE ELSE.
    // Also upgrade soft-locks to hard-locks
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
    const lockKeys = await this.redis.keys('lock:*:*');
    const softLockKeys = await this.redis.keys('softlock:*:*');
    const allKeys = [...lockKeys, ...softLockKeys];
    
    if (allKeys.length === 0) return;

    const pipeline = this.redis.pipeline();
    const values = await this.redis.mget(allKeys);

    allKeys.forEach((key, index) => {
      if (values[index] === userId) {
        pipeline.del(key);
      }
    });

    await pipeline.exec();
    this.logger.log(`Released all locks for user: ${userId}`);
  }

  // --- TWO-PHASE LOCKING: SOFT-LOCKS ---

  async softLockSeat(showtimeId: string, seatId: string, userId: string): Promise<boolean> {
    // Check if hard-locked or soft-locked by someone else
    const softKey = `softlock:${showtimeId}:${seatId}`;
    const hardKey = `lock:${showtimeId}:${seatId}`;

    const script = `
      local softKey = KEYS[1]
      local hardKey = KEYS[2]
      local userId = ARGV[1]
      local ttl = ARGV[2]

      -- Check hard lock
      local hardOwner = redis.call("GET", hardKey)
      if hardOwner and hardOwner ~= userId then
        return 0
      end

      -- Check soft lock
      local softOwner = redis.call("GET", softKey)
      if softOwner and softOwner ~= userId then
        return 0
      end

      redis.call("SET", softKey, userId, "EX", ttl)
      return 1
    `;

    const result = await this.redis.eval(script, 2, softKey, hardKey, userId, this.LOCK_TTL);
    return result === 1;
  }

  async releaseSoftLockSeat(showtimeId: string, seatId: string, userId: string): Promise<void> {
    const softKey = `softlock:${showtimeId}:${seatId}`;
    const script = `
      local key = KEYS[1]
      local userId = ARGV[1]
      local currentOwner = redis.call("GET", key)
      if currentOwner == userId then
        redis.call("DEL", key)
      end
      return 1
    `;
    await this.redis.eval(script, 1, softKey, userId);
  }
}
