import { Controller, Get, Post, Query, UseGuards, Param } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { MovieSyncService } from './movie-sync.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('movies')
export class MoviesController {
  constructor(
    private readonly moviesService: MoviesService,
    private readonly movieSyncService: MovieSyncService,
  ) {}

  @Get()
  async findAll(@Query('genre') genre?: string) {
    return this.moviesService.findAll(genre);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.moviesService.findOne(id);
  }

  @Post('sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async syncMovies(@Query('limit') limit?: string) {
    const syncLimit = limit ? parseInt(limit, 10) : 20;
    return this.movieSyncService.syncTrendingMovies(syncLimit);
  }
}
