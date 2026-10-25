import { Test, TestingModule } from "@nestjs/testing";
import { BookingController } from "./booking.controller";
import { BookingService } from "./booking.service";
import { BookingGateway } from "./booking.gateway";

describe("BookingController", () => {
  let controller: BookingController;
  let bookingService: any;
  let bookingGateway: any;

  const mockShowtimeId = "showtime-101";
  const mockUserId = "user-123";
  const mockReq = { user: { id: mockUserId } };

  beforeEach(async () => {
    bookingService = {
      getShowtimeDetails: jest.fn().mockResolvedValue({ id: mockShowtimeId }),
      getSeatsStatus: jest.fn().mockResolvedValue([]),
      lockSeats: jest.fn().mockResolvedValue(true),
      createBooking: jest.fn().mockResolvedValue({ id: "booking-999" }),
      getBookingById: jest.fn().mockResolvedValue({ id: "booking-999", userId: mockUserId }),
    };

    bookingGateway = {
      notifySeatsLocked: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        { provide: BookingService, useValue: bookingService },
        { provide: BookingGateway, useValue: bookingGateway },
      ],
    }).compile();

    controller = module.get<BookingController>(BookingController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getShowtime", () => {
    it("should call bookingService.getShowtimeDetails", async () => {
      const res = await controller.getShowtime(mockShowtimeId);
      expect(bookingService.getShowtimeDetails).toHaveBeenCalledWith(mockShowtimeId);
      expect(res).toEqual({ id: mockShowtimeId });
    });
  });

  describe("getSeats", () => {
    it("should call bookingService.getSeatsStatus", async () => {
      const res = await controller.getSeats(mockShowtimeId);
      expect(bookingService.getSeatsStatus).toHaveBeenCalledWith(mockShowtimeId);
      expect(res).toEqual([]);
    });
  });

  describe("lockSeats", () => {
    it("should lock seats and notify room via bookingGateway", async () => {
      const res = await controller.lockSeats(
        mockShowtimeId,
        { seatIds: ["seat-A1", "seat-A2"] },
        mockReq,
      );

      expect(bookingService.lockSeats).toHaveBeenCalledWith(
        mockShowtimeId,
        ["seat-A1", "seat-A2"],
        mockUserId,
      );
      expect(bookingGateway.notifySeatsLocked).toHaveBeenCalledWith(
        mockShowtimeId,
        ["seat-A1", "seat-A2"],
        mockUserId,
      );
      expect(res).toEqual({
        success: true,
        message: "Seats locked successfully",
      });
    });
  });

  describe("createBooking", () => {
    it("should create booking and notify room via bookingGateway", async () => {
      const payload = {
        showtimeId: mockShowtimeId,
        seatIds: ["seat-A1"],
        combos: [{ comboId: "c1", quantity: 1 }],
      };

      const res = await controller.createBooking(payload, mockReq);

      expect(bookingService.createBooking).toHaveBeenCalledWith(
        mockUserId,
        mockShowtimeId,
        payload.seatIds,
        payload.combos,
      );
      expect(bookingGateway.notifySeatsLocked).toHaveBeenCalledWith(
        mockShowtimeId,
        payload.seatIds,
        mockUserId,
      );
      expect(res).toEqual({ id: "booking-999" });
    });
  });

  describe("getBooking", () => {
    it("should call bookingService.getBookingById with user ID", async () => {
      const res = await controller.getBooking("booking-999", mockReq);
      expect(bookingService.getBookingById).toHaveBeenCalledWith(
        "booking-999",
        mockUserId,
      );
      expect(res).toEqual({ id: "booking-999", userId: mockUserId });
    });
  });
});
