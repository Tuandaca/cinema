import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Optional,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { MovieStatus, BookingStatus } from "@prisma/client";
import { CreateMovieDto, UpdateMovieDto } from "./dto/movie.dto";
import { CreateShowtimeDto, UpdateShowtimeDto } from "./dto/showtime.dto";

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly redisService?: RedisService,
  ) {}

  // ==========================================
  // 1. ANALYTICS & DASHBOARD METRICS
  // ==========================================
  async getAnalytics() {
    // 1. Total Revenue from PAID bookings
    const paidBookings = await this.prisma.booking.findMany({
      where: { status: BookingStatus.PAID },
      include: {
        seats: true,
        showtime: {
          include: { movie: true },
        },
      },
    });

    const totalRevenue = paidBookings.reduce(
      (sum, b) => sum + b.totalAmount,
      0,
    );
    const totalTickets = paidBookings.reduce(
      (sum, b) => sum + b.seats.length,
      0,
    );

    // 2. Movie counts
    const activeMovies = await this.prisma.movie.count({
      where: { status: MovieStatus.NOW_SHOWING },
    });
    const comingSoonMovies = await this.prisma.movie.count({
      where: { status: MovieStatus.COMING_SOON },
    });

    // 3. Room & Seat counts
    const totalRooms = await this.prisma.theaterRoom.count();
    const totalSeats = await this.prisma.seat.count();

    // 4. Booking counts
    const totalBookings = await this.prisma.booking.count();
    const pendingBookings = await this.prisma.booking.count({
      where: { status: BookingStatus.PENDING },
    });

    // 5. Daily Revenue for past 7 days
    const now = new Date();
    const past7Days: {
      date: string;
      label: string;
      revenue: number;
      tickets: number;
    }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayLabel = `${d.getDate()}/${d.getMonth() + 1}`;

      const startOfDay = new Date(d);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(d);
      endOfDay.setHours(23, 59, 59, 999);

      const dayBookings = paidBookings.filter(
        (b) => b.createdAt >= startOfDay && b.createdAt <= endOfDay,
      );

      const dayRev = dayBookings.reduce((s, b) => s + b.totalAmount, 0);
      const dayTix = dayBookings.reduce((s, b) => s + b.seats.length, 0);

      past7Days.push({
        date: dateStr,
        label: dayLabel,
        revenue: dayRev,
        tickets: dayTix,
      });
    }

    // 6. Top 5 Movies by Revenue
    const movieRevenueMap = new Map<
      string,
      {
        title: string;
        posterUrl: string | null;
        revenue: number;
        tickets: number;
      }
    >();

    for (const b of paidBookings) {
      const movie = b.showtime?.movie;
      if (movie) {
        const existing = movieRevenueMap.get(movie.id) || {
          title: movie.title,
          posterUrl: movie.posterUrl,
          revenue: 0,
          tickets: 0,
        };
        existing.revenue += b.totalAmount;
        existing.tickets += b.seats.length;
        movieRevenueMap.set(movie.id, existing);
      }
    }

    const topMovies = Array.from(movieRevenueMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // 7. Recent 10 Bookings
    const recentBookings = await this.prisma.booking.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        showtime: {
          include: {
            movie: { select: { title: true, posterUrl: true } },
            room: { select: { name: true } },
          },
        },
        seats: {
          include: {
            seat: { select: { row: true, number: true, type: true } },
          },
        },
      },
    });

    // 8. Overall Occupancy Rate
    const totalShowtimes = await this.prisma.showtime.count();
    const potentialCapacity =
      totalShowtimes * (totalSeats / Math.max(1, totalRooms));
    const occupancyRate =
      potentialCapacity > 0
        ? Math.min(100, Math.round((totalTickets / potentialCapacity) * 100))
        : 0;

    return {
      totalRevenue,
      totalTickets,
      activeMovies,
      comingSoonMovies,
      totalRooms,
      totalSeats,
      totalBookings,
      pendingBookings,
      occupancyRate,
      past7Days,
      topMovies,
      recentBookings,
    };
  }

  // ==========================================
  // 2. MOVIES MANAGEMENT
  // ==========================================
  async getMovies(query: {
    search?: string;
    status?: MovieStatus;
    page?: number;
    limit?: number;
  }) {
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.movie.findMany({
        where,
        include: {
          genres: true,
          _count: {
            select: { showtimes: true },
          },
        },
        orderBy: { released: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.movie.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createMovie(data: CreateMovieDto) {
    const { genres, ...movieData } = data;

    const movie = await this.prisma.movie.create({
      data: {
        title: movieData.title,
        description: movieData.description,
        trailerUrl: movieData.trailerUrl,
        posterUrl: movieData.posterUrl,
        status: movieData.status || MovieStatus.COMING_SOON,
        rating: movieData.rating,
        runtime: movieData.runtime,
        released: movieData.released ? new Date(movieData.released) : null,
        certification: movieData.certification,
        language: movieData.language,
        genres:
          genres && genres.length > 0
            ? {
                connectOrCreate: genres.map((g) => ({
                  where: { name: g.trim() },
                  create: { name: g.trim() },
                })),
              }
            : undefined,
      },
      include: { genres: true },
    });

    if (this.redisService) {
      await this.redisService.delPattern("movies:list:*");
      await this.redisService.del(`movies:detail:${movie.id}`);
    }

    return movie;
  }

  async updateMovie(id: string, data: UpdateMovieDto) {
    const movie = await this.prisma.movie.findUnique({ where: { id } });
    if (!movie) {
      throw new NotFoundException("Phim không tồn tại");
    }

    const { genres, ...movieData } = data;

    const updated = await this.prisma.movie.update({
      where: { id },
      data: {
        ...movieData,
        released: movieData.released ? new Date(movieData.released) : undefined,
        genres: genres
          ? {
              set: [],
              connectOrCreate: genres.map((g) => ({
                where: { name: g.trim() },
                create: { name: g.trim() },
              })),
            }
          : undefined,
      },
      include: { genres: true },
    });

    if (this.redisService) {
      await this.redisService.delPattern("movies:list:*");
      await this.redisService.del(`movies:detail:${id}`);
    }

    return updated;
  }

  async deleteMovie(id: string) {
    const movie = await this.prisma.movie.findUnique({
      where: { id },
      include: {
        showtimes: {
          include: {
            bookings: {
              where: { status: BookingStatus.PAID },
            },
          },
        },
      },
    });

    if (!movie) {
      throw new NotFoundException("Phim không tồn tại");
    }

    const hasPaidBookings = movie.showtimes.some(
      (st) => st.bookings.length > 0,
    );
    if (hasPaidBookings) {
      throw new BadRequestException(
        "Không thể xóa phim này vì đã có suất chiếu phát sinh vé đã thanh toán.",
      );
    }

    // Delete showtimes without paid bookings first
    await this.prisma.bookingSeat.deleteMany({
      where: { booking: { showtime: { movieId: id } } },
    });
    await this.prisma.booking.deleteMany({
      where: { showtime: { movieId: id } },
    });
    await this.prisma.showtime.deleteMany({
      where: { movieId: id },
    });

    const deleted = await this.prisma.movie.delete({
      where: { id },
    });

    if (this.redisService) {
      await this.redisService.delPattern("movies:list:*");
      await this.redisService.del(`movies:detail:${id}`);
    }

    return deleted;
  }

  // ==========================================
  // 3. SHOWTIMES MANAGEMENT
  // ==========================================
  async getShowtimes(query: {
    date?: string;
    movieId?: string;
    roomId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.movieId) where.movieId = query.movieId;
    if (query.roomId) where.roomId = query.roomId;

    if (query.date) {
      const startOfDay = new Date(`${query.date}T00:00:00.000Z`);
      const endOfDay = new Date(`${query.date}T23:59:59.999Z`);
      where.startTime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.showtime.findMany({
        where,
        include: {
          movie: {
            select: { id: true, title: true, posterUrl: true, runtime: true },
          },
          room: { select: { id: true, name: true, capacity: true } },
          _count: {
            select: { bookings: true },
          },
        },
        orderBy: { startTime: "asc" },
        skip,
        take: limit,
      }),
      this.prisma.showtime.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createShowtime(data: CreateShowtimeDto) {
    const movie = await this.prisma.movie.findUnique({
      where: { id: data.movieId },
    });
    if (!movie) throw new NotFoundException("Phim không tồn tại");

    const room = await this.prisma.theaterRoom.findUnique({
      where: { id: data.roomId },
    });
    if (!room) throw new NotFoundException("Phòng chiếu không tồn tại");

    const startTime = new Date(data.startTime);
    if (isNaN(startTime.getTime())) {
      throw new BadRequestException("Thời gian bắt đầu không hợp lệ");
    }

    // Default runtime is 120 minutes if not provided
    const runtime = movie.runtime || 120;
    // Buffer time: 15 minutes for cleaning and audience ingress
    const endTime = new Date(startTime.getTime() + (runtime + 15) * 60 * 1000);

    // Conflict detection in the same room
    const conflict = await this.prisma.showtime.findFirst({
      where: {
        roomId: data.roomId,
        AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
      },
      include: { movie: true },
    });

    if (conflict) {
      const conflictStart = conflict.startTime.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const conflictEnd = conflict.endTime.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      throw new BadRequestException(
        `Trùng lịch chiếu tại phòng ${room.name}! Suất "${conflict.movie.title}" đang diễn ra từ ${conflictStart} đến ${conflictEnd}.`,
      );
    }

    const showtime = await this.prisma.showtime.create({
      data: {
        movieId: data.movieId,
        roomId: data.roomId,
        startTime,
        endTime,
        priceBase: Number(data.priceBase),
      },
      include: {
        movie: true,
        room: true,
      },
    });

    if (this.redisService) {
      await this.redisService.delPattern("movies:showtimes:*");
    }

    return showtime;
  }

  async updateShowtime(id: string, data: UpdateShowtimeDto) {
    const existing = await this.prisma.showtime.findUnique({
      where: { id },
      include: { movie: true },
    });
    if (!existing) throw new NotFoundException("Suất chiếu không tồn tại");

    const roomId = data.roomId || existing.roomId;
    const movieId = data.movieId || existing.movieId;

    const movie = await this.prisma.movie.findUnique({
      where: { id: movieId },
    });
    const runtime = movie?.runtime || 120;

    let startTime = existing.startTime;
    let endTime = existing.endTime;

    if (data.startTime) {
      startTime = new Date(data.startTime);
      endTime = new Date(startTime.getTime() + (runtime + 15) * 60 * 1000);
    }

    // Conflict detection
    const conflict = await this.prisma.showtime.findFirst({
      where: {
        id: { not: id },
        roomId,
        AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
      },
      include: { movie: true },
    });

    if (conflict) {
      throw new BadRequestException(
        `Trùng lịch chiếu với phim "${conflict.movie.title}"`,
      );
    }

    const updated = await this.prisma.showtime.update({
      where: { id },
      data: {
        roomId,
        movieId,
        startTime,
        endTime,
        priceBase:
          data.priceBase !== undefined ? Number(data.priceBase) : undefined,
      },
      include: {
        movie: true,
        room: true,
      },
    });

    if (this.redisService) {
      await this.redisService.delPattern("movies:showtimes:*");
    }

    return updated;
  }

  async deleteShowtime(id: string) {
    const showtime = await this.prisma.showtime.findUnique({
      where: { id },
      include: {
        bookings: {
          where: { status: BookingStatus.PAID },
        },
      },
    });

    if (!showtime) throw new NotFoundException("Suất chiếu không tồn tại");

    if (showtime.bookings.length > 0) {
      throw new BadRequestException(
        "Không thể xóa suất chiếu đã có vé thanh toán.",
      );
    }

    // Delete related pending bookings first
    await this.prisma.bookingSeat.deleteMany({
      where: { booking: { showtimeId: id } },
    });
    await this.prisma.booking.deleteMany({
      where: { showtimeId: id },
    });

    const deleted = await this.prisma.showtime.delete({
      where: { id },
    });

    if (this.redisService) {
      await this.redisService.delPattern("movies:showtimes:*");
    }

    return deleted;
  }

  // ==========================================
  // 4. THEATERS & SEATS MANAGEMENT
  // ==========================================
  async getRooms() {
    const rooms = await this.prisma.theaterRoom.findMany({
      include: {
        seats: true,
        _count: {
          select: { showtimes: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return rooms.map((r) => {
      const normalSeats = r.seats.filter((s) => s.type === "NORMAL").length;
      const vipSeats = r.seats.filter((s) => s.type === "VIP").length;
      const sweetboxSeats = r.seats.filter((s) => s.type === "SWEETBOX").length;

      return {
        id: r.id,
        name: r.name,
        capacity: r.capacity,
        totalSeats: r.seats.length,
        seatCounts: {
          normal: normalSeats,
          vip: vipSeats,
          sweetbox: sweetboxSeats,
        },
        showtimesCount: r._count.showtimes,
      };
    });
  }

  async getRoomSeats(roomId: string) {
    const room = await this.prisma.theaterRoom.findUnique({
      where: { id: roomId },
      include: {
        seats: {
          orderBy: [{ row: "asc" }, { number: "asc" }],
        },
      },
    });

    if (!room) throw new NotFoundException("Phòng chiếu không tồn tại");

    // Group seats by row
    const rowMap = new Map<string, any[]>();
    for (const seat of room.seats) {
      const existing = rowMap.get(seat.row) || [];
      existing.push(seat);
      rowMap.set(seat.row, existing);
    }

    const rows = Array.from(rowMap.entries()).map(([rowName, seats]) => ({
      row: rowName,
      seats,
    }));

    return {
      room: {
        id: room.id,
        name: room.name,
        capacity: room.capacity,
      },
      rows,
    };
  }

  // ==========================================
  // 5. BOOKINGS MANAGEMENT
  // ==========================================
  async getBookings(query: {
    status?: BookingStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 15;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { id: { contains: query.search, mode: "insensitive" } },
        { user: { email: { contains: query.search, mode: "insensitive" } } },
        { user: { name: { contains: query.search, mode: "insensitive" } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          showtime: {
            include: {
              movie: { select: { id: true, title: true, posterUrl: true } },
              room: { select: { id: true, name: true } },
            },
          },
          seats: {
            include: {
              seat: {
                select: { id: true, row: true, number: true, type: true },
              },
            },
          },
          orderItems: {
            include: { combo: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateBookingStatus(id: string, status: BookingStatus) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException("Đơn vé không tồn tại");

    return this.prisma.booking.update({
      where: { id },
      data: { status },
    });
  }
}
