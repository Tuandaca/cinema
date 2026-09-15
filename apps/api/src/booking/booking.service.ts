import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
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
  private redisAvailable = false;

  constructor(private prisma: PrismaService) {
    const redisUrl = process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL || 'redis://localhost:6379';
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          this.logger.warn('Redis connection failed after 3 retries. Seat locking will be unavailable.');
          return null; // Stop retrying
        }
        return Math.min(times * 500, 5000);
      },
      lazyConnect: true,
    });
    this.redis.on('error', (err) => this.logger.error('Redis Client Error', err.message));
    this.redis.on('connect', () => {
      this.redisAvailable = true;
      this.logger.log('✅ Connected to Redis');
    });
    this.redis.on('close', () => {
      this.redisAvailable = false;
      this.logger.warn('⚠️ Redis connection closed');
    });

    // Attempt connection (non-blocking)
    this.redis.connect().catch((err) => {
      this.logger.warn(`⚠️ Redis not available: ${err.message}. Seat locking features will be degraded.`);
    });
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

    // Get hard-locked and soft-locked seats from Redis (resilient fallback)
    const lockedSeats = new Map<string, string>(); // seatId -> userId
    const softLockedSeats = new Map<string, string>(); // seatId -> userId

    if (this.redisAvailable) {
      try {
        const lockKeysPattern = `lock:${showtimeId}:*`;
        const lockKeys = await this.redis.keys(lockKeysPattern);

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

        const softLockKeysPattern = `softlock:${showtimeId}:*`;
        const softLockKeys = await this.redis.keys(softLockKeysPattern);

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
      } catch (err: any) {
        this.logger.warn(`Redis unavailable while fetching seats status: ${err.message}`);
      }
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
    if (!this.redisAvailable) {
      this.logger.warn('Redis unavailable: skipping Redis lock, relying on DB check only.');
      return true;
    }

    const lockKeys = seatIds.map(id => `lock:${showtimeId}:${id}`);
    
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

    try {
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
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      this.logger.warn(`Redis lockSeats error: ${err.message}. Proceeding without Redis.`);
    }

    return true;
  }

  async releaseLocks(showtimeId: string, seatIds: string[], userId: string): Promise<void> {
    if (!this.redisAvailable) return;
    const lockKeys = seatIds.map(id => `lock:${showtimeId}:${id}`);
    
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

    try {
      await this.redis.eval(script, lockKeys.length, ...lockKeys, userId);
    } catch (err: any) {
      this.logger.warn(`Redis releaseLocks error: ${err.message}`);
    }
  }

  async releaseAllUserLocks(userId: string): Promise<void> {
    if (!this.redisAvailable) return;
    try {
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
    } catch (err: any) {
      this.logger.warn(`Redis releaseAllUserLocks error: ${err.message}`);
    }
  }

  // --- TWO-PHASE LOCKING: SOFT-LOCKS ---

  async softLockSeat(showtimeId: string, seatId: string, userId: string): Promise<boolean> {
    if (!this.redisAvailable) return true;

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

    try {
      const result = await this.redis.eval(script, 2, softKey, hardKey, userId, this.LOCK_TTL);
      return result === 1;
    } catch (err: any) {
      this.logger.warn(`Redis softLockSeat error: ${err.message}`);
      return true;
    }
  }

  async releaseSoftLockSeat(showtimeId: string, seatId: string, userId: string): Promise<void> {
    if (!this.redisAvailable) return;

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
    try {
      await this.redis.eval(script, 1, softKey, userId);
    } catch (err: any) {
      this.logger.warn(`Redis releaseSoftLockSeat error: ${err.message}`);
    }
  }

  // --- ORDER CREATION ---

  async createBooking(
    userId: string,
    showtimeId: string,
    seatIds: string[],
    combos: { comboId: string; quantity: number }[]
  ) {
    // Validate user existence — NO fallback to prevent unauthorized bookings
    const userExists = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      throw new UnauthorizedException('Invalid user. Please log in again.');
    }

    const showtime = await this.prisma.showtime.findUnique({
      where: { id: showtimeId },
    });

    if (!showtime) throw new BadRequestException('Showtime not found');

    // Fetch seat details to calculate correct price per seat type
    const seats = await this.prisma.seat.findMany({
      where: { id: { in: seatIds } },
    });

    let totalAmount = 0;

    // Calculate seats price with type multiplier
    for (const seat of seats) {
      const basePrice = showtime.priceBase;
      let multiplier = 1.0;
      if (seat.type === 'VIP') multiplier = 1.5;
      else if (seat.type === 'SWEETBOX') multiplier = 2.0;
      totalAmount += basePrice * multiplier;
    }

    // Calculate combos price
    const orderItemsData = [];
    if (combos && combos.length > 0) {
      for (const item of combos) {
        const combo = await this.prisma.combo.findUnique({ where: { id: item.comboId } });
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
        status: 'PENDING',
        totalAmount,
        seats: {
          create: seatIds.map(seatId => ({
            seatId,
            price: showtime.priceBase,
          })),
        },
        orderItems: {
          create: orderItemsData,
        },
      },
    });

    // RELEASE REDIS LOCKS IMMEDIATELY after successful DB creation
    try {
      await this.releaseLocks(showtimeId, seatIds, userId);
      this.logger.log(`Released locks for seats ${seatIds.join(', ')} after booking ${booking.id}`);
    } catch (err) {
      this.logger.error(`Failed to release locks after booking: ${err.message}`);
    }

    return booking;
  }
}
