import { Controller, Post, Body, Param, UseGuards, Req } from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("payment")
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

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
    return this.paymentService.generateMockQRCode(bookingId, amount);
  }

  @UseGuards(JwtAuthGuard)
  @Post(":bookingId/confirm")
  async confirmPayment(@Param("bookingId") bookingId: string, @Req() req: any) {
    return this.paymentService.confirmMockPayment(bookingId, req.user.id);
  }
}
