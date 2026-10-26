import { Test, TestingModule } from "@nestjs/testing";
import { PaymentController } from "./payment.controller";
import { PaymentService } from "./payment.service";
import { BookingService } from "../booking/booking.service";

describe("PaymentController", () => {
  let controller: PaymentController;
  let mockPaymentService: any;
  let mockBookingService: any;

  beforeEach(async () => {
    mockPaymentService = {
      verifyBookingOwnership: jest.fn().mockResolvedValue(undefined),
      createPaymentIntent: jest.fn().mockResolvedValue({ clientSecret: "secret" }),
      generateVietQRCode: jest.fn().mockImplementation((bookingId, amount) => ({
        qrUrl: `https://img.vietqr.io/image/970436-1028472918-compact2.png?amount=${amount}&addInfo=COICINE-${bookingId}`,
        bookingId,
        amount,
      })),
      confirmMockPayment: jest.fn().mockResolvedValue({ success: true }),
      handleStripeWebhook: jest.fn().mockResolvedValue({ received: true }),
    };

    mockBookingService = {
      getBookingById: jest.fn().mockResolvedValue({
        id: "booking-101",
        userId: "user-123",
        totalAmount: 240000,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        { provide: PaymentService, useValue: mockPaymentService },
        { provide: BookingService, useValue: mockBookingService },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("createQRCode", () => {
    it("should use authoritative booking.totalAmount from database ignoring client amount", async () => {
      const mockReq = { user: { id: "user-123" } };
      const clientTamperedAmount = 1000; // Malicious client attempts 1,000 VND

      const res = await controller.createQRCode(
        "booking-101",
        clientTamperedAmount,
        mockReq,
      );

      expect(mockPaymentService.verifyBookingOwnership).toHaveBeenCalledWith(
        "booking-101",
        "user-123",
      );
      expect(mockBookingService.getBookingById).toHaveBeenCalledWith(
        "booking-101",
        "user-123",
      );
      // Authoritative amount 240000 must be passed to generateVietQRCode, NOT 1000
      expect(mockPaymentService.generateVietQRCode).toHaveBeenCalledWith(
        "booking-101",
        240000,
      );
      expect(res.amount).toBe(240000);
    });

    it("should fall back to client amount if bookingService is not available", async () => {
      const standaloneController = new PaymentController(mockPaymentService);
      const mockReq = { user: { id: "user-123" } };

      const res = await standaloneController.createQRCode(
        "booking-101",
        150000,
        mockReq,
      );

      expect(mockPaymentService.verifyBookingOwnership).toHaveBeenCalledWith(
        "booking-101",
        "user-123",
      );
      expect(mockPaymentService.generateVietQRCode).toHaveBeenCalledWith(
        "booking-101",
        150000,
      );
      expect(res.amount).toBe(150000);
    });
  });
});
