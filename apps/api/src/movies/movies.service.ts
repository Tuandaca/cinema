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
}
