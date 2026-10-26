import { Test, TestingModule } from "@nestjs/testing";
import { BookingService } from "./booking.service";
import { ShowtimeGuard } from "./guards/showtime.guard";
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
    startTime: new Date(Date.now() + 86400000),
    priceBase: 100000,
    room: {
      id: "room-1",
      seats: mockSeats,
    },
    movie: {
      id: "movie-1",
      title: "Dune Part Two",
      genres: [{ id: "g-1", name: "Sci-Fi" }],
    },
  };

  beforeEach(async () => {
    mockPrisma = {
      showtime: {
        findUnique: jest.fn().mockResolvedValue(mockShowtime),
        findMany: jest.fn().mockResolvedValue([mockShowtime]),
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

    it("should reject lockSeats for past showtimes with BadRequestException", async () => {
      mockPrisma.showtime.findUnique.mockResolvedValueOnce({
        ...mockShowtime,
        startTime: new Date(Date.now() - 3600000), // 1 hour ago
      });

      await expect(
        bookingService.lockSeats(mockShowtimeId, ["seat-A1"], mockUserId),
      ).rejects.toThrow("Không thể giữ ghế cho suất chiếu đã quá hạn");
    });
  });

  describe("softLockSeat & releaseSoftLockSeat", () => {
    it("should soft-lock a seat for the user", async () => {
      const ok = await bookingService.softLockSeat(mockShowtimeId, "seat-A1", mockUserId);
      expect(ok).toBe(true);
      expect(await redisService.getLock(`softlock:${mockShowtimeId}:seat-A1`)).toBe(mockUserId);
    });

    it("should reject softLockSeat for past showtimes", async () => {
      mockPrisma.showtime.findUnique.mockResolvedValueOnce({
        ...mockShowtime,
        startTime: new Date(Date.now() - 3600000), // 1 hour ago
      });

      const result = await bookingService.softLockSeat(mockShowtimeId, "seat-A1", mockUserId);
      expect(result).toBe(false);
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

    it("should reject createBooking for past showtimes with BadRequestException", async () => {
      mockPrisma.showtime.findUnique.mockResolvedValueOnce({
        ...mockShowtime,
        startTime: new Date(Date.now() - 3600000), // 1 hour ago
      });

      await expect(
        bookingService.createBooking(mockUserId, mockShowtimeId, ["seat-A1"], []),
      ).rejects.toThrow("Không thể đặt vé cho suất chiếu đã quá hạn");
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

  describe("getPublicShowtimes", () => {
    it("should query showtimes within dayStart and dayEnd for valid YYYY-MM-DD date", async () => {
      const result = await bookingService.getPublicShowtimes("2026-10-26");
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(mockPrisma.showtime.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startTime: {
              gte: new Date("2026-10-26T00:00:00.000+07:00"),
              lte: new Date("2026-10-26T23:59:59.999+07:00"),
            },
          }),
        }),
      );
    });

    it("should query future showtimes starting from current time when date is omitted", async () => {
      const result = await bookingService.getPublicShowtimes();
      expect(result).toBeDefined();
      expect(mockPrisma.showtime.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startTime: {
              gte: expect.any(Date),
            },
          }),
        }),
      );
    });

    it("should query future showtimes when date is empty or whitespace string", async () => {
      const result = await bookingService.getPublicShowtimes("   ");
      expect(result).toBeDefined();
      expect(mockPrisma.showtime.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startTime: {
              gte: expect.any(Date),
            },
          }),
        }),
      );
    });

    it("should throw BadRequestException when date is 'invalid-date'", async () => {
      await expect(
        bookingService.getPublicShowtimes("invalid-date"),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException when date is '2026-99-99'", async () => {
      await expect(
        bookingService.getPublicShowtimes("2026-99-99"),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException when date is 'null'", async () => {
      await expect(
        bookingService.getPublicShowtimes("null"),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException when date is 'undefined'", async () => {
      await expect(
        bookingService.getPublicShowtimes("undefined"),
      ).rejects.toThrow(BadRequestException);
    });

    it("should filter by movieId when movieId is provided", async () => {
      await bookingService.getPublicShowtimes("2026-10-27", "movie-uuid-1");
      expect(mockPrisma.showtime.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            movieId: "movie-uuid-1",
            startTime: {
              gte: new Date("2026-10-27T00:00:00.000+07:00"),
              lte: new Date("2026-10-27T23:59:59.999+07:00"),
            },
          }),
        }),
      );
    });

    it("should return cached showtimes on subsequent calls with the same params", async () => {
      const firstResult = await bookingService.getPublicShowtimes("2026-10-28", "movie-uuid-1");
      const callsBefore = mockPrisma.showtime.findMany.mock.calls.length;

      const cachedResult = await bookingService.getPublicShowtimes("2026-10-28", "movie-uuid-1");
      expect(mockPrisma.showtime.findMany.mock.calls.length).toBe(callsBefore);
      expect(cachedResult).toEqual(firstResult);
    });
  });

  describe("ShowtimeGuard", () => {
    let guard: ShowtimeGuard;

    beforeEach(() => {
      guard = new ShowtimeGuard(mockPrisma);
    });

    it("should allow future showtimes via route param id", async () => {
      const mockContext: any = {
        switchToHttp: () => ({
          getRequest: () => ({ params: { id: mockShowtimeId } }),
        }),
      };
      const allowed = await guard.canActivate(mockContext);
      expect(allowed).toBe(true);
    });

    it("should allow future showtimes via request body showtimeId", async () => {
      const mockContext: any = {
        switchToHttp: () => ({
          getRequest: () => ({ params: {}, body: { showtimeId: mockShowtimeId } }),
        }),
      };
      const allowed = await guard.canActivate(mockContext);
      expect(allowed).toBe(true);
    });

    it("should reject past showtimes with BadRequestException", async () => {
      mockPrisma.showtime.findUnique.mockResolvedValueOnce({
        id: mockShowtimeId,
        startTime: new Date(Date.now() - 3600000), // 1 hour ago
      });

      const mockContext: any = {
        switchToHttp: () => ({
          getRequest: () => ({ params: { id: mockShowtimeId } }),
        }),
      };

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        "Không thể đặt hoặc giữ ghế cho suất chiếu đã kết thúc hoặc đang diễn ra",
      );
    });

    it("should reject non-existent showtimes with BadRequestException", async () => {
      mockPrisma.showtime.findUnique.mockResolvedValueOnce(null);

      const mockContext: any = {
        switchToHttp: () => ({
          getRequest: () => ({ params: { id: "non-existent" } }),
        }),
      };

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        "Suất chiếu không tồn tại",
      );
    });

    it("should return true when no showtimeId is provided in request", async () => {
      const mockContext: any = {
        switchToHttp: () => ({
          getRequest: () => ({ params: {}, body: {} }),
        }),
      };
      const allowed = await guard.canActivate(mockContext);
      expect(allowed).toBe(true);
    });
  });
});
