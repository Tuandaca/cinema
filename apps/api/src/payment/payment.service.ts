import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { BookingService } from "../booking/booking.service";
import Stripe from "stripe";

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private stripe: Stripe | null = null;

  constructor(
    private prisma: PrismaService,
    private bookingService: BookingService,
  ) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (
      stripeKey &&
      !stripeKey.includes("placeholder") &&
      !stripeKey.includes("mock")
    ) {
      try {
        this.stripe = new Stripe(stripeKey, {
          apiVersion: "2024-12-18.acacia" as any,
        });
        this.logger.log("Stripe client initialized successfully.");
      } catch (err: any) {
        this.logger.warn(
          `Stripe client initialization failed: ${err.message}. Using mock fallback.`,
        );
        this.stripe = null;
      }
    } else {
      this.logger.warn("Stripe secret key absent. Mock fallback active.");
    }
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

  /**
   * Create a Stripe PaymentIntent in VND (zero-decimal currency) with graceful mock fallback.
   */
  async createPaymentIntent(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    const amount = Math.round(booking.totalAmount);

    if (this.stripe) {
      try {
        // Stripe VND is a zero-decimal currency (no multiplication by 100)
        const paymentIntent = await this.stripe.paymentIntents.create({
          amount,
          currency: "vnd",
          payment_method_types: ["card"],
          metadata: {
            bookingId: booking.id,
            userId: booking.userId,
          },
          description: `CoiCine Ticket Booking #${booking.id.slice(0, 8)}`,
        });

        return {
          clientSecret: paymentIntent.client_secret,
          bookingId: booking.id,
          isMock: false,
        };
      } catch (err: any) {
        this.logger.error(
          `Stripe error: ${err.message}. Falling back to mock secret.`,
        );
      }
    }

    this.logger.warn("Returning mock client_secret for testing/sandbox.");
    return {
      clientSecret: `pi_mock_secret_${booking.id}`,
      bookingId: booking.id,
      isMock: true,
    };
  }

  /**
   * Bank-grade VietQR Napas 247 QuickLink standard generator:
   * https://img.vietqr.io/image/<BANK_BIN>-<ACCOUNT_NO>-compact2.png?amount=<AMOUNT>&addInfo=COICINE-<BOOKING_ID>&accountName=<ACCOUNT_NAME>
   * Default: BANK_BIN=970436, ACCOUNT_NO=1028472918, ACCOUNT_NAME=CONG TY TNHH COICINE VIETNAM
   */
  generateVietQRCode(bookingId: string, customAmount?: number) {
    const bankBin =
      process.env.BANK_BIN || process.env.VIETQR_BANK_ID || "970436";
    const accountNo =
      process.env.ACCOUNT_NO || process.env.VIETQR_ACCOUNT_NO || "1028472918";
    const accountName =
      process.env.ACCOUNT_NAME ||
      process.env.VIETQR_ACCOUNT_NAME ||
      "CONG TY TNHH COICINE VIETNAM";
    const template = process.env.VIETQR_TEMPLATE || "compact2";
    const amount = Math.round(customAmount || 0);
    const addInfo = `COICINE-${bookingId}`;

    const qrUrl = `https://img.vietqr.io/image/${bankBin}-${accountNo}-${template}.png?amount=${amount}&addInfo=${encodeURIComponent(addInfo)}&accountName=${encodeURIComponent(accountName)}`;

    const bankName =
      bankBin === "970436"
        ? "Vietcombank"
        : bankBin === "970422"
          ? "MBBank"
          : "Napas 247 Bank";

    return {
      qrUrl,
      bookingId,
      amount,
      bankInfo: {
        bankBin,
        bankId: bankBin,
        bankName,
        accountNo,
        accountNumber: accountNo,
        accountName,
        amount,
        addInfo,
        transferContent: addInfo,
      },
    };
  }

  /**
   * Generate QR Code (Mock & VietQR QuickLink compatible).
   */
  generateMockQRCode(bookingId: string, amount: number) {
    return this.generateVietQRCode(bookingId, amount);
  }

  /**
   * Webhook handler: verifies Stripe webhook signature or parses payload,
   * updates booking to PAID, and logs the confirmation.
   */
  async handleStripeWebhook(payload: any, signature?: string) {
    this.logger.log("Stripe webhook received.");
    let event: any = payload;

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (this.stripe && signature && webhookSecret) {
      try {
        event = this.stripe.webhooks.constructEvent(
          payload,
          signature,
          webhookSecret,
        );
      } catch (err: any) {
        this.logger.error(
          `Webhook signature verification failed: ${err.message}`,
        );
        throw new BadRequestException(`Webhook Error: ${err.message}`);
      }
    }

    const eventType = event?.type;
    if (
      eventType === "payment_intent.succeeded" ||
      event?.status === "PAID" ||
      eventType === "checkout.session.completed"
    ) {
      const paymentIntent = event?.data?.object;
      const bookingId =
        paymentIntent?.metadata?.bookingId ||
        event?.bookingId ||
        event?.metadata?.bookingId;

      if (bookingId) {
        const booking = await this.prisma.booking.findUnique({
          where: { id: bookingId },
          include: { seats: true },
        });

        if (booking) {
          await this.prisma.booking.update({
            where: { id: bookingId },
            data: { status: "PAID" },
          });

          this.logger.log(
            `Booking ${bookingId} confirmed as PAID via Stripe webhook.`,
          );
        }
      }
    }

    return { received: true };
  }

  /**
   * Called by payment success flow to confirm a booking payment.
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
