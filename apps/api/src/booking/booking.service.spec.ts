import { Test, TestingModule } from "@nestjs/testing";
import { BookingService } from "./booking.service";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { BadRequestException, UnauthorizedException } from "@nestjs/common";

describe("BookingService with Resilient In-Memory Seat Locking", () => {
  let bookingService: BookingService;
  let redisService: RedisService;
  let mockPrisma: any;

  const mockShowtimeId = "showtime-uuid-123";
  const mockUserId = "user-alice-1";
  const mockUserBob = "user-bob-2";

  const mockSeats = [
    { id: "seat-A1", row: "A", number: 1, type: "STANDARD" },
    { id: "seat-A2", row: "A", number: 2, type: "VIP" },
    { id: "seat-A3", row: "A", number: 3, type: "SWEETBOX" },
  ];

  const mockShowtime = {
    id: mockShowtimeId,
    priceBase: 100000,
    room: {
      id: "room-1",
      seats: mockSeats,
    },
    movie: {
      id: "movie-1",
      title: "Dune Part Two",
    },
  };

  beforeEach(async () => {
    mockPrisma = {
      showtime: {
        findUnique: jest.fn().mockResolvedValue(mockShowtime),
      },
      booking: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockImplementation(({ data }) => ({
          id: "booking-uuid-999",
          ...data,
        })),
        findUnique: jest.fn(),
      },
      bookingSeat: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      seat: {
        findMany: jest.fn().mockImplementation(({ where }) => {
          if (where?.id?.in) {
            return mockSeats.filter((s) => where.id.in.includes(s.id));
          }
          return mockSeats;
        }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: mockUserId, email: "alice@test.com" }),
      },
      combo: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        RedisService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    bookingService = module.get<BookingService>(BookingService);
    redisService = module.get<RedisService>(RedisService);

    // Force RedisService to run in pure in-memory fallback mode
    (redisService as any).redisAvailable = false;
    (redisService as any).memoryCache.clear();
  });

  afterEach(async () => {
    await redisService.onModuleDestroy();
  });

  it("should be defined", () => {
    expect(bookingService).toBeDefined();
    expect(redisService).toBeDefined();
    expect(redisService.isAvailable()).toBe(false);
  });

  describe("getSeatsStatus", () => {
    it("should return all seats as AVAILABLE when no locks or bookings exist", async () => {
      const statuses = await bookingService.getSeatsStatus(mockShowtimeId);
      expect(statuses).toHaveLength(3);
      expect(statuses.every((s) => s.status === "AVAILABLE")).toBe(true);
    });

    it("should mark seats as BOOKED if booked in DB (PAID)", async () => {
      mockPrisma.booking.findMany.mockResolvedValueOnce([
        {
          id: "b1",
          status: "PAID",
          seats: [{ seatId: "seat-A1" }],
        },
      ]);

      const statuses = await bookingService.getSeatsStatus(mockShowtimeId);
      const s1 = statuses.find((s) => s.id === "seat-A1");
      const s2 = statuses.find((s) => s.id === "seat-A2");

      expect(s1?.status).toBe("BOOKED");
      expect(s2?.status).toBe("AVAILABLE");
    });

    it("should mark seats as SELECTING if soft-locked in RedisService", async () => {
      await bookingService.softLockSeat(mockShowtimeId, "seat-A2", mockUserId);

      const statuses = await bookingService.getSeatsStatus(mockShowtimeId);
      const s2 = statuses.find((s) => s.id === "seat-A2");

      expect(s2?.status).toBe("SELECTING");
      expect(s2?.lockedBy).toBe(mockUserId);
    });

    it("should mark seats as LOCKED if hard-locked in RedisService", async () => {
      await bookingService.lockSeats(mockShowtimeId, ["seat-A3"], mockUserId);

      const statuses = await bookingService.getSeatsStatus(mockShowtimeId);
      const s3 = statuses.find((s) => s.id === "seat-A3");

      expect(s3?.status).toBe("LOCKED");
      expect(s3?.lockedBy).toBe(mockUserId);
    });
  });

  describe("lockSeats (5-Minute Hold & Atomic Multi-Seat Reservation)", () => {
    it("should successfully lock available seats and clean up caller's soft-locks", async () => {
      // Alice soft-locks A1 and A2 first
      await bookingService.softLockSeat(mockShowtimeId, "seat-A1", mockUserId);
      await bookingService.softLockSeat(mockShowtimeId, "seat-A2", mockUserId);

      // Alice proceeds to lock them
      const success = await bookingService.lockSeats(
        mockShowtimeId,
        ["seat-A1", "seat-A2"],
        mockUserId,
      );
      expect(success).toBe(true);

      // Verify hard locks are active in RedisService
      expect(await redisService.getLock(`lock:${mockShowtimeId}:seat-A1`)).toBe(mockUserId);
      expect(await redisService.getLock(`lock:${mockShowtimeId}:seat-A2`)).toBe(mockUserId);

      // Soft-locks should be cleaned up
      expect(await redisService.getLock(`softlock:${mockShowtimeId}:seat-A1`)).toBeNull();
      expect(await redisService.getLock(`softlock:${mockShowtimeId}:seat-A2`)).toBeNull();
    });

    it("should reject lockSeats when empty seat list is passed", async () => {
      await expect(
        bookingService.lockSeats(mockShowtimeId, [], mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it("should reject lockSeats if any seat is already booked in DB", async () => {
      mockPrisma.bookingSeat.findFirst.mockResolvedValueOnce({
        id: "bs1",
        seatId: "seat-A1",
      });

      await expect(
        bookingService.lockSeats(mockShowtimeId, ["seat-A1"], mockUserId),
      ).rejects.toThrow("Một hoặc nhiều ghế đã được đặt hoặc đang thanh toán.");
    });

    it("should reject lockSeats if any seat is hard-locked by another user", async () => {
      // Alice locks A1
      await bookingService.lockSeats(mockShowtimeId, ["seat-A1"], mockUserId);

      // Bob tries to lock A1 and A2
      await expect(
        bookingService.lockSeats(mockShowtimeId, ["seat-A1", "seat-A2"], mockUserBob),
      ).rejects.toThrow("Ghế đang được người khác giữ.");

      // A2 must NOT be locked by Bob (atomic all-or-nothing guarantee)
      expect(await redisService.getLock(`lock:${mockShowtimeId}:seat-A2`)).toBeNull();
    });

    it("should reject lockSeats if any seat is currently soft-locked by another user", async () => {
      // Alice is currently selecting A1 (soft-lock)
      await bookingService.softLockSeat(mockShowtimeId, "seat-A1", mockUserId);

      // Bob tries to hard-lock A1 directly
      await expect(
        bookingService.lockSeats(mockShowtimeId, ["seat-A1"], mockUserBob),
      ).rejects.toThrow("Ghế đang được người khác giữ.");

      // A1 must remain soft-locked by Alice and not hard-locked
      expect(await redisService.getLock(`softlock:${mockShowtimeId}:seat-A1`)).toBe(mockUserId);
      expect(await redisService.getLock(`lock:${mockShowtimeId}:seat-A1`)).toBeNull();
    });

    it("should allow the same user to renew an existing lock", async () => {
      await bookingService.lockSeats(mockShowtimeId, ["seat-A1"], mockUserId);
      const renewed = await bookingService.lockSeats(mockShowtimeId, ["seat-A1"], mockUserId);
      expect(renewed).toBe(true);
      expect(await redisService.getLock(`lock:${mockShowtimeId}:seat-A1`)).toBe(mockUserId);
    });
  });

  describe("softLockSeat & releaseSoftLockSeat", () => {
    it("should soft-lock a seat for the user", async () => {
      const ok = await bookingService.softLockSeat(mockShowtimeId, "seat-A1", mockUserId);
      expect(ok).toBe(true);
      expect(await redisService.getLock(`softlock:${mockShowtimeId}:seat-A1`)).toBe(mockUserId);
    });

    it("should reject soft-lock if another user currently holds the soft-lock", async () => {
      await bookingService.softLockSeat(mockShowtimeId, "seat-A1", mockUserId);
      const blocked = await bookingService.softLockSeat(mockShowtimeId, "seat-A1", mockUserBob);
      expect(blocked).toBe(false);
      expect(await redisService.getLock(`softlock:${mockShowtimeId}:seat-A1`)).toBe(mockUserId);
    });

    it("should reject soft-lock if seat is already hard-locked by another user", async () => {
      await bookingService.lockSeats(mockShowtimeId, ["seat-A1"], mockUserId);
      const blocked = await bookingService.softLockSeat(mockShowtimeId, "seat-A1", mockUserBob);
      expect(blocked).toBe(false);
    });

    it("should release soft-lock via releaseSoftLockSeat", async () => {
      await bookingService.softLockSeat(mockShowtimeId, "seat-A1", mockUserId);
      await bookingService.releaseSoftLockSeat(mockShowtimeId, "seat-A1", mockUserId);
      expect(await redisService.getLock(`softlock:${mockShowtimeId}:seat-A1`)).toBeNull();
    });
  });

  describe("createBooking (Order Creation & Seat Lock Ownership Verification)", () => {
    it("should reject createBooking if requested seats are locked by another user in Redis", async () => {
      // Alice has locked seat A1
      await bookingService.lockSeats(mockShowtimeId, ["seat-A1"], mockUserId);

      // Bob tries to create a booking for seat A1
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: mockUserBob });

      await expect(
        bookingService.createBooking(mockUserBob, mockShowtimeId, ["seat-A1"], []),
      ).rejects.toThrow("Một hoặc nhiều ghế đang được giữ bởi người khác.");
    });

    it("should successfully create booking for lock owner and immediately release Redis locks", async () => {
      // Alice locks seat A1 and A2
      await bookingService.lockSeats(mockShowtimeId, ["seat-A1", "seat-A2"], mockUserId);

      const booking = await bookingService.createBooking(
        mockUserId,
        mockShowtimeId,
        ["seat-A1", "seat-A2"],
        [],
      );

      expect(booking).toBeDefined();
      expect(mockPrisma.booking.create).toHaveBeenCalled();

      // Verify that Redis locks for A1 and A2 were immediately released after booking creation
      expect(await redisService.getLock(`lock:${mockShowtimeId}:seat-A1`)).toBeNull();
      expect(await redisService.getLock(`lock:${mockShowtimeId}:seat-A2`)).toBeNull();
    });

    it("should reject createBooking if requested seats are soft-locked by another user in Redis", async () => {
      // Bob has soft-locked seat A1
      await bookingService.softLockSeat(mockShowtimeId, "seat-A1", mockUserBob);

      // Alice tries to create a booking for seat A1
      await expect(
        bookingService.createBooking(mockUserId, mockShowtimeId, ["seat-A1"], []),
      ).rejects.toThrow("Một hoặc nhiều ghế đang được giữ bởi người khác.");
    });

    it("should reject lockSeats with duplicate seat IDs", async () => {
      await expect(
        bookingService.lockSeats(mockShowtimeId, ["seat-A1", "seat-A1"], mockUserId),
      ).rejects.toThrow("Danh sách ghế không được trùng lặp.");
    });

    it("should reject createBooking with duplicate seat IDs", async () => {
      await expect(
        bookingService.createBooking(mockUserId, mockShowtimeId, ["seat-A1", "seat-A1"], []),
      ).rejects.toThrow("Danh sách ghế không được trùng lặp.");
    });

    it("should release both hard and soft locks held by user upon successful booking creation", async () => {
      await bookingService.softLockSeat(mockShowtimeId, "seat-A1", mockUserId);
      await bookingService.lockSeats(mockShowtimeId, ["seat-A1"], mockUserId);

      await bookingService.createBooking(mockUserId, mockShowtimeId, ["seat-A1"], []);

      expect(await redisService.getLock(`lock:${mockShowtimeId}:seat-A1`)).toBeNull();
      expect(await redisService.getLock(`softlock:${mockShowtimeId}:seat-A1`)).toBeNull();
    });

    it("should reject createBooking if user does not exist", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        bookingService.createBooking("unknown-user", mockShowtimeId, ["seat-A1"], []),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("releaseAllUserLocks (WebSocket Disconnect Cleanup)", () => {
    it("should safely release all hard and soft locks belonging to disconnected user", async () => {
      // Alice has 1 hard lock and 1 soft lock
      await bookingService.lockSeats(mockShowtimeId, ["seat-A1"], mockUserId);
      await bookingService.softLockSeat(mockShowtimeId, "seat-A2", mockUserId);

      // Bob has 1 hard lock on seat A3
      await bookingService.lockSeats(mockShowtimeId, ["seat-A3"], mockUserBob);

      // Alice disconnects
      const released = await bookingService.releaseAllUserLocks(mockUserId);

      // Alice's locks must be deleted
      expect(await redisService.getLock(`lock:${mockShowtimeId}:seat-A1`)).toBeNull();
      expect(await redisService.getLock(`softlock:${mockShowtimeId}:seat-A2`)).toBeNull();

      // Bob's lock must remain intact
      expect(await redisService.getLock(`lock:${mockShowtimeId}:seat-A3`)).toBe(mockUserBob);

      // Verification of returned released info
      expect(released).toHaveLength(2);
      expect(released).toEqual(
        expect.arrayContaining([
          { showtimeId: mockShowtimeId, seatId: "seat-A1", type: "lock" },
          { showtimeId: mockShowtimeId, seatId: "seat-A2", type: "softlock" },
        ]),
      );
    });
  });

  describe("releaseUserShowtimeSoftLocks (Showtime Navigation Cleanup)", () => {
    it("should only release soft-locks for the specified showtime, leaving other showtimes and hard-locks intact", async () => {
      const showtime2 = "showtime-uuid-456";

      // Alice has soft-lock in showtime 1 and showtime 2
      await bookingService.softLockSeat(mockShowtimeId, "seat-A1", mockUserId);
      await bookingService.softLockSeat(showtime2, "seat-A1", mockUserId);

      // Alice also has a hard lock in showtime 1
      await bookingService.lockSeats(mockShowtimeId, ["seat-A2"], mockUserId);

      // Alice navigates away from showtime 1
      const released = await bookingService.releaseUserShowtimeSoftLocks(
        mockShowtimeId,
        mockUserId,
      );

      expect(released).toEqual(["seat-A1"]);
      // Showtime 1 soft-lock is gone
      expect(await redisService.getLock(`softlock:${mockShowtimeId}:seat-A1`)).toBeNull();
      // Showtime 1 hard-lock is preserved (checkout in progress)
      expect(await redisService.getLock(`lock:${mockShowtimeId}:seat-A2`)).toBe(mockUserId);
      // Showtime 2 soft-lock remains untouched
      expect(await redisService.getLock(`softlock:${showtime2}:seat-A1`)).toBe(mockUserId);
    });
  });
});
