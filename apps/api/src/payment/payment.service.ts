import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingService } from '../booking/booking.service';

@Injectable()
export class PaymentService {
  private stripe: any;
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private prisma: PrismaService,
    private bookingService: BookingService,
  ) {
    this.logger.log('Mock Payment Service initialized.');
  }

  async createPaymentIntent(bookingId: string) {
    // 1. Fetch booking
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Convert amount to cents
    const amountInCents = Math.round(booking.totalAmount * 100);

    // 2. Mock PaymentIntent
    this.logger.warn('Returning mock client_secret for frontend testing.');
    return {
      clientSecret: 'pi_mock_secret_123',
      bookingId: booking.id,
      isMock: true,
    };
  }

  generateMockQRCode(bookingId: string, amount: number) {
    // Mock VNPay / Momo QR Code URL
    return {
      qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=COICINE-${bookingId}-${amount}`,
      bookingId,
    };
  }

  async handleStripeWebhook(payload: Buffer, signature: string) {
    // Verify signature logic...
    // For MVP, we assume the payment is successful
    return { received: true };
  }
}
