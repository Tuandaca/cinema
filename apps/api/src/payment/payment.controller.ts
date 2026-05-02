import { Controller, Post, Body, Param } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post(':bookingId/intent')
  async createIntent(@Param('bookingId') bookingId: string) {
    return this.paymentService.createPaymentIntent(bookingId);
  }

  @Post(':bookingId/qr-code')
  async createQRCode(
    @Param('bookingId') bookingId: string,
    @Body('amount') amount: number,
  ) {
    return this.paymentService.generateMockQRCode(bookingId, amount);
  }

  // TODO: Add saved-cards API when Membership is fully built out
}
