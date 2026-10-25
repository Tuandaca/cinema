import { Test, TestingModule } from "@nestjs/testing";
import { AdminService } from "./admin.service";
import { PrismaService } from "../prisma/prisma.service";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { BookingStatus, MovieStatus } from "@prisma/client";

describe("AdminService", () => {
  let service: AdminService;

  const mockPrisma = {
    booking: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    movie: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    showtime: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    theaterRoom: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    seat: {
      count: jest.fn(),
    },
    bookingSeat: {
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  // ==========================================
  // 1. ANALYTICS & DASHBOARD METRICS
  // ==========================================
  describe("getAnalytics", () => {
    it("should correctly calculate total revenue, ticket count, 7-day stats, and top movies from PAID bookings", async () => {
      const now = new Date();
      mockPrisma.booking.findMany
        .mockResolvedValueOnce([
          {
            id: "b1",
            status: BookingStatus.PAID,
            totalAmount: 180000,
            createdAt: now,
            seats: [{ id: "s1" }, { id: "s2" }],
            showtime: {
              movie: {
                id: "m1",
                title: "Movie 1",
                posterUrl: "http://img.com/1",
              },
            },
          },
        ]) // for paidBookings
        .mockResolvedValueOnce([
          {
            id: "b1",
            createdAt: now,
            user: { id: "u1", name: "User 1", email: "user@test.com" },
            showtime: {
              movie: { title: "Movie 1", posterUrl: "http://img.com/1" },
              room: { name: "Cinema 01" },
            },
            seats: [{ seat: { row: "A", number: 1, type: "NORMAL" } }],
          },
        ]); // for recentBookings

      mockPrisma.movie.count
        .mockResolvedValueOnce(5) // activeMovies
        .mockResolvedValueOnce(2); // comingSoonMovies
      mockPrisma.theaterRoom.count.mockResolvedValue(2);
      mockPrisma.seat.count.mockResolvedValue(50);
      mockPrisma.booking.count
        .mockResolvedValueOnce(10) // totalBookings
        .mockResolvedValueOnce(1); // pendingBookings
      mockPrisma.showtime.count.mockResolvedValue(4);

      const result = await service.getAnalytics();

      expect(result.totalRevenue).toBe(180000);
      expect(result.totalTickets).toBe(2);
      expect(result.activeMovies).toBe(5);
      expect(result.comingSoonMovies).toBe(2);
      expect(result.totalRooms).toBe(2);
      expect(result.totalSeats).toBe(50);
      expect(result.totalBookings).toBe(10);
      expect(result.pendingBookings).toBe(1);
      expect(result.past7Days).toHaveLength(7);
      expect(result.topMovies).toHaveLength(1);
      expect(result.topMovies[0].title).toBe("Movie 1");
      expect(result.topMovies[0].revenue).toBe(180000);
      expect(result.recentBookings).toHaveLength(1);
      expect(result.occupancyRate).toBeGreaterThan(0);
    });

    it("should return occupancyRate 0 when potentialCapacity is 0", async () => {
      mockPrisma.booking.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockPrisma.movie.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
      mockPrisma.theaterRoom.count.mockResolvedValue(0);
      mockPrisma.seat.count.mockResolvedValue(0);
      mockPrisma.booking.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      mockPrisma.showtime.count.mockResolvedValue(0);

      const result = await service.getAnalytics();

      expect(result.occupancyRate).toBe(0);
      expect(result.totalRevenue).toBe(0);
      expect(result.totalTickets).toBe(0);
    });
  });

  // ==========================================
  // 2. MOVIES MANAGEMENT
  // ==========================================
  describe("getMovies", () => {
    it("should return paginated movies with default values when query is empty", async () => {
      const mockMovies = [
        { id: "m1", title: "Movie 1", genres: [], _count: { showtimes: 2 } },
      ];
      mockPrisma.movie.findMany.mockResolvedValue(mockMovies);
      mockPrisma.movie.count.mockResolvedValue(1);

      const result = await service.getMovies({});

      expect(result.items).toEqual(mockMovies);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(mockPrisma.movie.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        }),
      );
    });

    it("should apply search keyword and status filters to query", async () => {
      mockPrisma.movie.findMany.mockResolvedValue([]);
      mockPrisma.movie.count.mockResolvedValue(0);

      await service.getMovies({
        search: "Dune",
        status: MovieStatus.NOW_SHOWING,
        page: 2,
        limit: 5,
      });

      expect(mockPrisma.movie.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
          where: expect.objectContaining({
            status: MovieStatus.NOW_SHOWING,
            OR: [
              { title: { contains: "Dune", mode: "insensitive" } },
              { description: { contains: "Dune", mode: "insensitive" } },
            ],
          }),
        }),
      );
    });
  });

  describe("createMovie", () => {
    it("should create movie with genres via connectOrCreate", async () => {
      const dto = {
        title: "New Sci-Fi Movie",
        description: "An epic journey",
        status: MovieStatus.NOW_SHOWING,
        rating: 8.5,
        runtime: 120,
        released: "2026-05-01T00:00:00.000Z",
        genres: ["Action", "Sci-Fi"],
      };

      const createdMovie = {
        id: "m-new",
        ...dto,
        genres: [{ id: "g1", name: "Action" }],
      };
      mockPrisma.movie.create.mockResolvedValue(createdMovie);

      const result = await service.createMovie(dto as any);

      expect(mockPrisma.movie.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: "New Sci-Fi Movie",
            genres: {
              connectOrCreate: [
                { where: { name: "Action" }, create: { name: "Action" } },
                { where: { name: "Sci-Fi" }, create: { name: "Sci-Fi" } },
              ],
            },
          }),
        }),
      );
      expect(result.id).toBe("m-new");
    });

    it("should default status to COMING_SOON if status is not provided", async () => {
      const dto = {
        title: "Coming Soon Movie",
        description: "Waiting for release",
      };

      mockPrisma.movie.create.mockResolvedValue({
        id: "m-cs",
        ...dto,
        status: MovieStatus.COMING_SOON,
      });

      const result = await service.createMovie(dto as any);

      expect(mockPrisma.movie.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: MovieStatus.COMING_SOON,
          }),
        }),
      );
      expect(result.id).toBe("m-cs");
    });
  });

  describe("updateMovie", () => {
    it("should throw NotFoundException if movie does not exist", async () => {
      mockPrisma.movie.findUnique.mockResolvedValue(null);

      await expect(
        service.updateMovie("non-existent", { title: "Updated" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should update movie and reconnect genres if provided", async () => {
      mockPrisma.movie.findUnique.mockResolvedValue({
        id: "m1",
        title: "Old Title",
      });
      mockPrisma.movie.update.mockResolvedValue({
        id: "m1",
        title: "Updated Title",
      });

      const result = await service.updateMovie("m1", {
        title: "Updated Title",
        genres: ["Drama"],
      });

      expect(mockPrisma.movie.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "m1" },
          data: expect.objectContaining({
            title: "Updated Title",
            genres: {
              set: [],
              connectOrCreate: [
                { where: { name: "Drama" }, create: { name: "Drama" } },
              ],
            },
          }),
        }),
      );
      expect(result.title).toBe("Updated Title");
    });
  });

  describe("deleteMovie - Safe Deletion Check", () => {
    it("should throw NotFoundException if movie to delete is not found", async () => {
      mockPrisma.movie.findUnique.mockResolvedValue(null);

      await expect(service.deleteMovie("not-found-id")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw BadRequestException if movie has showtimes with PAID bookings", async () => {
      mockPrisma.movie.findUnique.mockResolvedValue({
        id: "m1",
        showtimes: [
          {
            id: "st-1",
            bookings: [{ id: "b-paid", status: BookingStatus.PAID }],
          },
        ],
      });

      await expect(service.deleteMovie("m1")).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrisma.movie.delete).not.toHaveBeenCalled();
    });

    it("should successfully delete dependent bookingSeats, bookings, showtimes, and movie when no paid bookings", async () => {
      mockPrisma.movie.findUnique.mockResolvedValue({
        id: "m1",
        showtimes: [
          {
            id: "st-1",
            bookings: [], // No paid bookings
          },
        ],
      });
      mockPrisma.bookingSeat.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.booking.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.showtime.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.movie.delete.mockResolvedValue({
        id: "m1",
        title: "Deleted Movie",
      });

      const result = await service.deleteMovie("m1");

      expect(mockPrisma.bookingSeat.deleteMany).toHaveBeenCalled();
      expect(mockPrisma.booking.deleteMany).toHaveBeenCalled();
      expect(mockPrisma.showtime.deleteMany).toHaveBeenCalled();
      expect(mockPrisma.movie.delete).toHaveBeenCalledWith({
        where: { id: "m1" },
      });
      expect(result.id).toBe("m1");
    });
  });

  // ==========================================
  // 3. SHOWTIMES MANAGEMENT
  // ==========================================
  describe("getShowtimes", () => {
    it("should query showtimes with date range filter and pagination", async () => {
      const mockShowtimes = [
        {
          id: "st1",
          startTime: new Date(),
          movie: { id: "m1" },
          room: { id: "r1" },
        },
      ];
      mockPrisma.showtime.findMany.mockResolvedValue(mockShowtimes);
      mockPrisma.showtime.count.mockResolvedValue(1);

      const result = await service.getShowtimes({
        date: "2026-10-25",
        movieId: "m1",
        roomId: "r1",
        page: 1,
        limit: 10,
      });

      expect(result.items).toEqual(mockShowtimes);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(mockPrisma.showtime.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            movieId: "m1",
            roomId: "r1",
            startTime: {
              gte: new Date("2026-10-25T00:00:00.000Z"),
              lte: new Date("2026-10-25T23:59:59.999Z"),
            },
          }),
        }),
      );
    });
  });

  describe("createShowtime", () => {
    it("should throw NotFoundException if movie does not exist", async () => {
      mockPrisma.movie.findUnique.mockResolvedValue(null);

      await expect(
        service.createShowtime({
          movieId: "m-none",
          roomId: "r1",
          startTime: "2026-11-20T14:00:00.000Z",
          priceBase: 80000,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException if theater room does not exist", async () => {
      mockPrisma.movie.findUnique.mockResolvedValue({ id: "m1", runtime: 120 });
      mockPrisma.theaterRoom.findUnique.mockResolvedValue(null);

      await expect(
        service.createShowtime({
          movieId: "m1",
          roomId: "r-none",
          startTime: "2026-11-20T14:00:00.000Z",
          priceBase: 80000,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if startTime is an invalid date string", async () => {
      mockPrisma.movie.findUnique.mockResolvedValue({ id: "m1", runtime: 120 });
      mockPrisma.theaterRoom.findUnique.mockResolvedValue({
        id: "r1",
        name: "Cinema 01",
      });

      await expect(
        service.createShowtime({
          movieId: "m1",
          roomId: "r1",
          startTime: "invalid-date",
          priceBase: 80000,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException if overlapping showtime exists in the same room", async () => {
      mockPrisma.movie.findUnique.mockResolvedValue({ id: "m1", runtime: 120 });
      mockPrisma.theaterRoom.findUnique.mockResolvedValue({
        id: "r1",
        name: "Cinema 01",
      });

      mockPrisma.showtime.findFirst.mockResolvedValue({
        id: "st-conflict",
        startTime: new Date("2026-09-20T18:00:00Z"),
        endTime: new Date("2026-09-20T20:15:00Z"),
        movie: { title: "Avengers" },
      });

      await expect(
        service.createShowtime({
          movieId: "m1",
          roomId: "r1",
          startTime: "2026-09-20T19:00:00Z",
          priceBase: 90000,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should successfully create showtime with 15m cleaning buffer when no conflict", async () => {
      mockPrisma.movie.findUnique.mockResolvedValue({ id: "m1", runtime: 120 });
      mockPrisma.theaterRoom.findUnique.mockResolvedValue({
        id: "r1",
        name: "Cinema 01",
      });
      mockPrisma.showtime.findFirst.mockResolvedValue(null);

      const createdShowtime = {
        id: "st-new",
        movieId: "m1",
        roomId: "r1",
        startTime: new Date("2026-09-20T18:00:00Z"),
        endTime: new Date("2026-09-20T20:15:00Z"), // 120m + 15m = 135m = 2h15m
        priceBase: 90000,
      };
      mockPrisma.showtime.create.mockResolvedValue(createdShowtime);

      const result = await service.createShowtime({
        movieId: "m1",
        roomId: "r1",
        startTime: "2026-09-20T18:00:00Z",
        priceBase: 90000,
      });

      expect(mockPrisma.showtime.create).toHaveBeenCalled();
      expect(result.id).toBe("st-new");
    });
  });

  describe("updateShowtime", () => {
    it("should throw NotFoundException if showtime to update does not exist", async () => {
      mockPrisma.showtime.findUnique.mockResolvedValue(null);

      await expect(
        service.updateShowtime("st-none", { priceBase: 90000 }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if update causes conflict with another showtime in same room", async () => {
      mockPrisma.showtime.findUnique.mockResolvedValue({
        id: "st-1",
        roomId: "r1",
        movieId: "m1",
        startTime: new Date("2026-11-20T14:00:00.000Z"),
        endTime: new Date("2026-11-20T16:15:00.000Z"),
      });
      mockPrisma.movie.findUnique.mockResolvedValue({ id: "m1", runtime: 120 });

      mockPrisma.showtime.findFirst.mockResolvedValue({
        id: "st-other",
        startTime: new Date("2026-11-20T15:00:00.000Z"),
        endTime: new Date("2026-11-20T17:15:00.000Z"),
        movie: { title: "Conflicting Movie" },
      });

      await expect(
        service.updateShowtime("st-1", {
          startTime: "2026-11-20T15:30:00.000Z",
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should successfully update showtime when no conflict", async () => {
      mockPrisma.showtime.findUnique.mockResolvedValue({
        id: "st-1",
        roomId: "r1",
        movieId: "m1",
        startTime: new Date("2026-11-20T14:00:00.000Z"),
        endTime: new Date("2026-11-20T16:15:00.000Z"),
      });
      mockPrisma.movie.findUnique.mockResolvedValue({ id: "m1", runtime: 120 });
      mockPrisma.showtime.findFirst.mockResolvedValue(null);
      mockPrisma.showtime.update.mockResolvedValue({
        id: "st-1",
        priceBase: 95000,
      });

      const result = await service.updateShowtime("st-1", { priceBase: 95000 });

      expect(mockPrisma.showtime.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "st-1" },
          data: expect.objectContaining({ priceBase: 95000 }),
        }),
      );
      expect(result.id).toBe("st-1");
    });
  });

  describe("deleteShowtime", () => {
    it("should throw NotFoundException if showtime does not exist", async () => {
      mockPrisma.showtime.findUnique.mockResolvedValue(null);

      await expect(service.deleteShowtime("st-none")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw BadRequestException if showtime has paid bookings", async () => {
      mockPrisma.showtime.findUnique.mockResolvedValue({
        id: "st-1",
        bookings: [{ id: "b1", status: BookingStatus.PAID }],
      });

      await expect(service.deleteShowtime("st-1")).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrisma.showtime.delete).not.toHaveBeenCalled();
    });

    it("should delete related bookingSeats, bookings, and showtime when no paid bookings", async () => {
      mockPrisma.showtime.findUnique.mockResolvedValue({
        id: "st-1",
        bookings: [],
      });
      mockPrisma.bookingSeat.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.booking.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.showtime.delete.mockResolvedValue({ id: "st-1" });

      const result = await service.deleteShowtime("st-1");

      expect(mockPrisma.bookingSeat.deleteMany).toHaveBeenCalledWith({
        where: { booking: { showtimeId: "st-1" } },
      });
      expect(mockPrisma.booking.deleteMany).toHaveBeenCalledWith({
        where: { showtimeId: "st-1" },
      });
      expect(mockPrisma.showtime.delete).toHaveBeenCalledWith({
        where: { id: "st-1" },
      });
      expect(result.id).toBe("st-1");
    });
  });

  // ==========================================
  // 4. THEATERS & SEATS INSPECTION
  // ==========================================
  describe("getRooms", () => {
    it("should aggregate seat counts by type and include showtimes count", async () => {
      mockPrisma.theaterRoom.findMany.mockResolvedValue([
        {
          id: "room-1",
          name: "Cinema 01",
          capacity: 4,
          seats: [
            { id: "s1", type: "NORMAL" },
            { id: "s2", type: "NORMAL" },
            { id: "s3", type: "VIP" },
            { id: "s4", type: "SWEETBOX" },
          ],
          _count: { showtimes: 3 },
        },
      ]);

      const result = await service.getRooms();

      expect(result).toHaveLength(1);
      expect(result[0].seatCounts.normal).toBe(2);
      expect(result[0].seatCounts.vip).toBe(1);
      expect(result[0].seatCounts.sweetbox).toBe(1);
      expect(result[0].totalSeats).toBe(4);
      expect(result[0].showtimesCount).toBe(3);
    });
  });

  describe("getRoomSeats", () => {
    it("should throw NotFoundException if room does not exist", async () => {
      mockPrisma.theaterRoom.findUnique.mockResolvedValue(null);

      await expect(service.getRoomSeats("room-none")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should group seats by row letter for seat layout", async () => {
      mockPrisma.theaterRoom.findUnique.mockResolvedValue({
        id: "room-1",
        name: "Cinema 01",
        capacity: 4,
        seats: [
          { id: "s1", row: "A", number: 1, type: "NORMAL" },
          { id: "s2", row: "A", number: 2, type: "NORMAL" },
          { id: "s3", row: "B", number: 1, type: "VIP" },
        ],
      });

      const result = await service.getRoomSeats("room-1");

      expect(result.room.id).toBe("room-1");
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].row).toBe("A");
      expect(result.rows[0].seats).toHaveLength(2);
      expect(result.rows[1].row).toBe("B");
      expect(result.rows[1].seats).toHaveLength(1);
    });
  });

  // ==========================================
  // 5. BOOKINGS MANAGEMENT
  // ==========================================
  describe("getBookings", () => {
    it("should return paginated bookings and filter by status and search", async () => {
      const mockBookings = [
        {
          id: "b-100",
          status: BookingStatus.PAID,
          user: { name: "Alice", email: "alice@test.com" },
          showtime: { movie: { title: "Movie 1" }, room: { name: "Room 1" } },
        },
      ];
      mockPrisma.booking.findMany.mockResolvedValue(mockBookings);
      mockPrisma.booking.count.mockResolvedValue(1);

      const result = await service.getBookings({
        status: BookingStatus.PAID,
        search: "Alice",
        page: 1,
        limit: 10,
      });

      expect(result.items).toEqual(mockBookings);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          where: expect.objectContaining({
            status: BookingStatus.PAID,
            OR: [
              { id: { contains: "Alice", mode: "insensitive" } },
              { user: { email: { contains: "Alice", mode: "insensitive" } } },
              { user: { name: { contains: "Alice", mode: "insensitive" } } },
            ],
          }),
        }),
      );
    });
  });

  describe("updateBookingStatus", () => {
    it("should throw NotFoundException if booking does not exist", async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.updateBookingStatus("b-none", BookingStatus.CANCELLED),
      ).rejects.toThrow(NotFoundException);
    });

    it("should update booking status successfully", async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({
        id: "b-1",
        status: BookingStatus.PENDING,
      });
      mockPrisma.booking.update.mockResolvedValue({
        id: "b-1",
        status: BookingStatus.PAID,
      });

      const result = await service.updateBookingStatus(
        "b-1",
        BookingStatus.PAID,
      );

      expect(mockPrisma.booking.update).toHaveBeenCalledWith({
        where: { id: "b-1" },
        data: { status: BookingStatus.PAID },
      });
      expect(result.status).toBe(BookingStatus.PAID);
    });
  });
});
