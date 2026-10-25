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

  async getShowtimes(movieId: string): Promise<ShowtimeWithRoom[]> {
    const cacheKey = `movies:showtimes:${movieId}`;
    if (this.redisService) {
      const cached = await this.redisService.get<ShowtimeWithRoom[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const showtimes = await this.prisma.showtime.findMany({
      where: {
        movieId,
        startTime: {
          gte: new Date(), // Only future showtimes
        },
      },
      include: {
        room: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    if (this.redisService) {
      await this.redisService.set(cacheKey, showtimes, 600);
    }

    return showtimes;
  }
}
