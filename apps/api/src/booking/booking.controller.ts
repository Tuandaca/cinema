import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { BookingService, SeatStatus } from './booking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BookingGateway } from './booking.gateway';

@Controller('showtimes')
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly bookingGateway: BookingGateway,
  ) {}

  @Get(':id')
  async getShowtime(@Param('id') id: string) {
    return this.bookingService.getShowtimeDetails(id);
  }

  @Get(':id/seats')
  async getSeats(@Param('id') id: string): Promise<SeatStatus[]> {
    return this.bookingService.getSeatsStatus(id);
  }

  // @UseGuards(JwtAuthGuard)
  @Post(':id/lock')
  async lockSeats(
    @Param('id') showtimeId: string,
    @Body() body: { seatIds: string[] },
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 'test-user-id';
    await this.bookingService.lockSeats(showtimeId, body.seatIds, userId);
    this.bookingGateway.notifySeatsLocked(showtimeId, body.seatIds, userId);
    return { success: true, message: 'Seats locked successfully' };
  }
}
