import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AdminService } from "./admin.service";
import { MovieSyncService } from "../movies/movie-sync.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role, MovieStatus, BookingStatus } from "@prisma/client";
import { CreateMovieDto, UpdateMovieDto } from "./dto/movie.dto";
import { CreateShowtimeDto, UpdateShowtimeDto } from "./dto/showtime.dto";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly movieSyncService: MovieSyncService,
  ) {}

  // ==========================================
  // 1. ANALYTICS
  // ==========================================
  @Get("analytics")
  async getAnalytics() {
    return this.adminService.getAnalytics();
  }

  // ==========================================
  // 2. MOVIES
  // ==========================================
  @Get("movies")
  async getMovies(
    @Query("search") search?: string,
    @Query("status") status?: MovieStatus,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.adminService.getMovies({
      search,
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    });
  }

  @Post("movies")
  async createMovie(@Body() body: CreateMovieDto) {
    return this.adminService.createMovie(body);
  }

  @Put("movies/:id")
  async updateMovie(@Param("id") id: string, @Body() body: UpdateMovieDto) {
    return this.adminService.updateMovie(id, body);
  }

  @Delete("movies/:id")
  async deleteMovie(@Param("id") id: string) {
    return this.adminService.deleteMovie(id);
  }

  @Post("movies/sync")
  async syncMovies(@Query("limit") limit?: string) {
    const syncLimit = limit ? parseInt(limit, 10) : 10;
    return this.movieSyncService.syncTrendingMovies(syncLimit);
  }

  // ==========================================
  // 3. SHOWTIMES
  // ==========================================
  @Get("showtimes")
  async getShowtimes(
    @Query("date") date?: string,
    @Query("movieId") movieId?: string,
    @Query("roomId") roomId?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.adminService.getShowtimes({
      date,
      movieId,
      roomId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Post("showtimes")
  async createShowtime(@Body() body: CreateShowtimeDto) {
    return this.adminService.createShowtime(body);
  }

  @Put("showtimes/:id")
  async updateShowtime(
    @Param("id") id: string,
    @Body() body: UpdateShowtimeDto,
  ) {
    return this.adminService.updateShowtime(id, body);
  }

  @Delete("showtimes/:id")
  async deleteShowtime(@Param("id") id: string) {
    return this.adminService.deleteShowtime(id);
  }

  // ==========================================
  // 4. THEATERS & SEATS
  // ==========================================
  @Get("rooms")
  async getRooms() {
    return this.adminService.getRooms();
  }

  @Get("rooms/:id/seats")
  async getRoomSeats(@Param("id") id: string) {
    return this.adminService.getRoomSeats(id);
  }

  // ==========================================
  // 5. BOOKINGS
  // ==========================================
  @Get("bookings")
  async getBookings(
    @Query("status") status?: BookingStatus,
    @Query("search") search?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.adminService.getBookings({
      status,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 15,
    });
  }

  @Put("bookings/:id/status")
  async updateBookingStatus(
    @Param("id") id: string,
    @Body() body: { status: BookingStatus },
  ) {
    return this.adminService.updateBookingStatus(id, body.status);
  }
}
