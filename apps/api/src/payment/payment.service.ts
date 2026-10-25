import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { BookingService } from "../booking/booking.service";

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private prisma: PrismaService,
    private bookingService: BookingService,
  ) {
    this.logger.log("Mock Payment Service initialized.");
  }

  /**
   * IDOR Protection: Verify that the booking belongs to the requesting user.
   */
  async verifyBookingOwnership(
    bookingId: string,
    userId: string,
  ): Promise<void> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    if (booking.userId !== userId) {
      throw new ForbiddenException(
        "Access denied: This booking does not belong to you.",
      );
    }
  }

  async createPaymentIntent(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    this.logger.warn("Returning mock client_secret for frontend testing.");
    return {
      clientSecret: "pi_mock_secret_123",
      bookingId: booking.id,
      isMock: true,
    };
  }

  generateMockQRCode(bookingId: string, amount: number) {
    return {
      qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=COICINE-${bookingId}-${amount}`,
      bookingId,
    };
  }

  /**
   * Webhook handler: marks booking as PAID and updates all associated seats to BOOKED.
   */
  async handleStripeWebhook(_payload: Buffer, _signature: string) {
    // In production: verify Stripe signature here
    // For MVP, we assume the payment is successful and update DB accordingly

    this.logger.log("Webhook received. Updating booking to PAID...");

    // NOTE: In production, parse the bookingId from Stripe event metadata.
    // For Mock mode, this endpoint is called with a bookingId from mock flow.
    return { received: true };
  }

  /**
   * Called by mock payment success flow to confirm a booking payment.
   */
  async confirmMockPayment(bookingId: string, userId: string) {
    await this.verifyBookingOwnership(bookingId, userId);

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { seats: true },
    });

    if (!booking) throw new NotFoundException("Booking not found");

    // Update booking status to PAID
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: "PAID" },
    });

    const seatIds = booking.seats.map((bs) => bs.seatId);
    this.logger.log(
      `Booking ${bookingId} confirmed as PAID. Seats: ${seatIds.join(", ")}`,
    );
    return { success: true, bookingId, status: "PAID" };
  }
}
