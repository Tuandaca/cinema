import { Controller, Get, Post, Query, UseGuards, Param, Res } from "@nestjs/common";
import type { Response } from "express";
import { MoviesService } from "./movies.service";
import { MovieSyncService } from "./movie-sync.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role } from "@prisma/client";

@Controller("movies")
export class MoviesController {
  constructor(
    private readonly moviesService: MoviesService,
    private readonly movieSyncService: MovieSyncService,
  ) {}

  @Get()
  async findAll(
    @Query("genre") genre?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.moviesService.findAll(genre, pageNum, limitNum);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.moviesService.findOne(id);
  }

  @Get(":id/showtimes")
  async getShowtimes(
    @Param("id") id: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("limit") limit?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    const showtimes = await this.moviesService.getShowtimes(
      id,
      startDate,
      endDate,
      limitNum,
    );
    if (res?.setHeader) {
      res.setHeader("X-Has-More", showtimes.hasMore ? "true" : "false");
    }
    return showtimes;
  }

  @Post("sync")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async syncMovies(@Query("limit") limit?: string) {
    const syncLimit = limit ? parseInt(limit, 10) : 20;
    return this.movieSyncService.syncTrendingMovies(syncLimit);
  }
}
