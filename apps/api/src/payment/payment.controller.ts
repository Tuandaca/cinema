import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Headers,
  Optional,
} from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { BookingService } from "../booking/booking.service";

@Controller("payment")
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    @Optional() private readonly bookingService?: BookingService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post(":bookingId/intent")
  async createIntent(@Param("bookingId") bookingId: string, @Req() req: any) {
    // IDOR protection: verify booking belongs to the authenticated user
    await this.paymentService.verifyBookingOwnership(bookingId, req.user.id);
    return this.paymentService.createPaymentIntent(bookingId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(":bookingId/qr-code")
  async createQRCode(
    @Param("bookingId") bookingId: string,
    @Body("amount") amount: number,
    @Req() req: any,
  ) {
    // IDOR protection: verify booking belongs to the authenticated user
    await this.paymentService.verifyBookingOwnership(bookingId, req.user.id);

    // Use authoritative booking.totalAmount from database to prevent client tampering
    let authoritativeAmount = amount;
    if (this.bookingService) {
      const booking = await this.bookingService.getBookingById(
        bookingId,
        req.user.id,
      );
      if (booking && typeof booking.totalAmount === "number") {
        authoritativeAmount = booking.totalAmount;
      }
    }

    return this.paymentService.generateVietQRCode(
      bookingId,
      authoritativeAmount,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(":bookingId/confirm")
  async confirmPayment(@Param("bookingId") bookingId: string, @Req() req: any) {
    return this.paymentService.confirmMockPayment(bookingId, req.user.id);
  }

  @Post("webhook")
  async handleWebhook(
    @Req() req: any,
    @Headers("stripe-signature") signature?: string,
  ) {
    return this.paymentService.handleStripeWebhook(req.body, signature);
  }
}
