import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MoviesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(genre?: string) {
    return this.prisma.movie.findMany({
      where: genre ? {
        genres: {
          some: { name: genre }
        }
      } : {},
      include: {
        genres: true,
      },
      orderBy: {
        released: 'desc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.movie.findUnique({
      where: { id },
      include: {
        genres: true,
      },
    });
  }

  async search(query: string) {
    return this.prisma.movie.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        genres: true,
      },
      take: 10,
    });
  }

  async getShowtimes(movieId: string) {
    return this.prisma.showtime.findMany({
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
        startTime: 'asc',
      },
    });
  }
}
