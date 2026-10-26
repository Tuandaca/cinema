import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { BookingService, SeatStatus } from "./booking.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { BookingGateway } from "./booking.gateway";

@Controller(["showtimes", "booking"])
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly bookingGateway: BookingGateway,
  ) {}

  @Get()
  async getPublicShowtimes(
    @Query("date") date?: string,
    @Query("movieId") movieId?: string,
  ) {
    return this.bookingService.getPublicShowtimes(date, movieId);
  }

  @UseGuards(JwtAuthGuard)
  @Get("my-tickets")
  async getMyTickets(@Req() req: any) {
    return this.bookingService.getMyBookings(req.user.id);
  }

  @Get(":id")
  async getShowtime(@Param("id") id: string) {
    return this.bookingService.getShowtimeDetails(id);
  }

  @Get(":id/seats")
  async getSeats(@Param("id") id: string): Promise<SeatStatus[]> {
    return this.bookingService.getSeatsStatus(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/lock")
  async lockSeats(
    @Param("id") showtimeId: string,
    @Body() body: { seatIds: string[] },
    @Req() req: any,
  ) {
    const userId = req.user.id;
    await this.bookingService.lockSeats(showtimeId, body.seatIds, userId);
    this.bookingGateway.notifySeatsLocked(showtimeId, body.seatIds, userId);
    return { success: true, message: "Seats locked successfully" };
  }

  @UseGuards(JwtAuthGuard)
  @Post("bookings")
  async createBooking(
    @Body()
    body: {
      showtimeId: string;
      seatIds: string[];
      combos: { comboId: string; quantity: number }[];
    },
    @Req() req: any,
  ) {
    const userId = req.user.id;
    const booking = await this.bookingService.createBooking(
      userId,
      body.showtimeId,
      body.seatIds,
      body.combos,
    );
    this.bookingGateway.notifySeatsLocked(
      body.showtimeId,
      body.seatIds,
      userId,
    );
    return booking;
  }

  @UseGuards(JwtAuthGuard)
  @Get("bookings/my")
  async getMyBookings(@Req() req: any) {
    return this.bookingService.getMyBookings(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("bookings/:id")
  async getBooking(@Param("id") id: string, @Req() req: any) {
    return this.bookingService.getBookingById(id, req.user.id);
  }
}
