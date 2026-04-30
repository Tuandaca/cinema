import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { BookingService, SeatStatus } from './booking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('showtimes')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get(':id/seats')
  async getSeats(@Param('id') id: string): Promise<SeatStatus[]> {
    return this.bookingService.getSeatsStatus(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/lock')
  async lockSeats(
    @Param('id') showtimeId: string,
    @Body() body: { seatIds: string[] },
    @Req() req: any,
  ) {
    const userId = req.user.userId;
    await this.bookingService.lockSeats(showtimeId, body.seatIds, userId);
    return { success: true, message: 'Seats locked successfully' };
  }
}
