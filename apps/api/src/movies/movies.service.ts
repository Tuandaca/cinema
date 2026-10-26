import { Injectable, Optional } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";

export type MovieWithGenres = Prisma.MovieGetPayload<{
  include: { genres: true };
}>;
export type ShowtimeWithRoom = Prisma.ShowtimeGetPayload<{
  include: { room: true };
}>;

@Injectable()
export class MoviesService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly redisService?: RedisService,
  ) {}

  async findAll(
    genre?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<MovieWithGenres[]> {
    const cacheKey = `movies:list:${genre || "all"}:${page}:${limit}`;
    if (this.redisService) {
      const cached = await this.redisService.get<MovieWithGenres[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const skip = Math.max(0, (page - 1) * limit);
    const movies = await this.prisma.movie.findMany({
      where: genre
        ? {
            genres: {
              some: { name: genre },
            },
          }
        : {},
      include: {
        genres: true,
      },
      orderBy: {
        released: "desc",
      },
      skip,
      take: limit,
    });

    if (this.redisService) {
      await this.redisService.set(cacheKey, movies, 3600);
    }

    return movies;
  }

  async findOne(id: string): Promise<MovieWithGenres | null> {
    const cacheKey = `movies:detail:${id}`;
    if (this.redisService) {
      const cached = await this.redisService.get<MovieWithGenres>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const movie = await this.prisma.movie.findUnique({
      where: { id },
      include: {
        genres: true,
      },
    });

    if (movie && this.redisService) {
      await this.redisService.set(cacheKey, movie, 3600);
    }

    return movie;
  }

  async search(query: string) {
    return this.prisma.movie.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        genres: true,
      },
      take: 10,
    });
  }

  async getShowtimes(
    movieId: string,
    startDate?: string,
    endDate?: string,
    limit?: number,
  ): Promise<ShowtimeWithRoom[] & { hasMore: boolean }> {
    const cacheKey = `movies:showtimes:${movieId}:${startDate || ""}:${endDate || ""}`;
    if (this.redisService) {
      const cached = await this.redisService.get<{
        showtimes: ShowtimeWithRoom[];
        hasMore: boolean;
      } | ShowtimeWithRoom[]>(cacheKey);
      if (cached) {
        if (Array.isArray(cached)) {
          return Object.assign(cached, { hasMore: false });
        }
        return Object.assign(cached.showtimes, { hasMore: cached.hasMore });
      }
    }

    const start = startDate ? new Date(startDate) : new Date();
    let end: Date | undefined;
    if (endDate) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        end = new Date(`${endDate}T23:59:59.999Z`);
      } else {
        end = new Date(endDate);
      }
    }

    const where: Prisma.ShowtimeWhereInput = {
      movieId,
      startTime: {
        gte: start,
        ...(end ? { lte: end } : {}),
      },
    };

    const showtimes = await this.prisma.showtime.findMany({
      where,
      include: {
        room: true,
      },
      orderBy: {
        startTime: "asc",
      },
      ...(limit ? { take: limit } : {}),
    });

    let hasMore = false;
    if (end) {
      const nextShowtime = await this.prisma.showtime.findFirst({
        where: {
          movieId,
          startTime: {
            gt: end,
          },
        },
        select: { id: true },
      });
      hasMore = !!nextShowtime;
    } else if (limit && showtimes.length >= limit) {
      const lastShowtime = showtimes[showtimes.length - 1];
      if (lastShowtime) {
        const nextShowtime = await this.prisma.showtime.findFirst({
          where: {
            movieId,
            startTime: {
              gt: lastShowtime.startTime,
            },
          },
          select: { id: true },
        });
        hasMore = !!nextShowtime;
      }
    }

    if (this.redisService) {
      await this.redisService.set(cacheKey, { showtimes, hasMore }, 600);
    }

    return Object.assign(showtimes, { hasMore });
  }

  async hasMoreShowtimes(movieId: string, afterDate: Date): Promise<boolean> {
    const nextShowtime = await this.prisma.showtime.findFirst({
      where: {
        movieId,
        startTime: {
          gt: afterDate,
        },
      },
      select: { id: true },
    });
    return !!nextShowtime;
  }
}
