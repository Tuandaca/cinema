import { BadRequestException, INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { BookingController } from "./booking.controller";
import { BookingService } from "./booking.service";
import { BookingGateway } from "./booking.gateway";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

describe("BookingController", () => {
  let controller: BookingController;
  let bookingService: any;
  let bookingGateway: any;

  const mockShowtimeId = "showtime-101";
  const mockUserId = "user-123";
  const mockReq = { user: { id: mockUserId } };

  beforeEach(async () => {
    bookingService = {
      getPublicShowtimes: jest.fn().mockResolvedValue([{ id: mockShowtimeId }]),
      getShowtimeDetails: jest.fn().mockResolvedValue({ id: mockShowtimeId }),
      getSeatsStatus: jest.fn().mockResolvedValue([]),
      lockSeats: jest.fn().mockResolvedValue(true),
      createBooking: jest.fn().mockResolvedValue({ id: "booking-999" }),
      getBookingById: jest.fn().mockResolvedValue({ id: "booking-999", userId: mockUserId }),
      getMyBookings: jest.fn().mockResolvedValue([{ id: "booking-999" }]),
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

  describe("getPublicShowtimes", () => {
    it("should delegate to bookingService.getPublicShowtimes with date and movieId", async () => {
      const res = await controller.getPublicShowtimes("2026-10-26", "movie-101");
      expect(bookingService.getPublicShowtimes).toHaveBeenCalledWith("2026-10-26", "movie-101");
      expect(res).toEqual([{ id: mockShowtimeId }]);
    });

    it("should propagate BadRequestException when bookingService rejects invalid date", async () => {
      bookingService.getPublicShowtimes.mockRejectedValueOnce(
        new BadRequestException("Invalid date format. Expected YYYY-MM-DD"),
      );

      await expect(
        controller.getPublicShowtimes("invalid-date"),
      ).rejects.toThrow(BadRequestException);
    });
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

  describe("getMyTickets", () => {
    it("should call bookingService.getMyBookings with authenticated user ID", async () => {
      const res = await controller.getMyTickets(mockReq);
      expect(bookingService.getMyBookings).toHaveBeenCalledWith(mockUserId);
      expect(res).toEqual([{ id: "booking-999" }]);
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

  describe("Route Precedence: GET my-tickets vs GET :id", () => {
    let app: INestApplication;
    let mockService: any;

    beforeAll(async () => {
      mockService = {
        getPublicShowtimes: jest.fn().mockResolvedValue([]),
        getShowtimeDetails: jest.fn().mockImplementation((id: string) => {
          if (id === "my-tickets") {
            // If route shadowing occurs, this branch would erroneously execute!
            throw new Error("Route shadowing defect: getShowtimeDetails called for 'my-tickets'!");
          }
          return Promise.resolve({ id, title: "Test Movie" });
        }),
        getSeatsStatus: jest.fn().mockResolvedValue([]),
        lockSeats: jest.fn().mockResolvedValue(true),
        createBooking: jest.fn().mockResolvedValue({ id: "booking-1" }),
        getMyBookings: jest.fn().mockResolvedValue([{ id: "ticket-101", userId: "user-123" }]),
        getBookingById: jest.fn().mockResolvedValue({ id: "booking-1" }),
      };

      const moduleRef = await Test.createTestingModule({
        controllers: [BookingController],
        providers: [
          { provide: BookingService, useValue: mockService },
          { provide: BookingGateway, useValue: { notifySeatsLocked: jest.fn() } },
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue({
          canActivate: (context: any) => {
            const req = context.switchToHttp().getRequest();
            req.user = { id: "user-123" };
            return true;
          },
        })
        .compile();

      app = moduleRef.createNestApplication();
      await app.init();
    });

    afterAll(async () => {
      if (app) await app.close();
    });

    it("GET /booking/my-tickets resolves to getMyTickets and does not trigger getShowtimeDetails", async () => {
      const res = await request(app.getHttpServer())
        .get("/booking/my-tickets")
        .expect(200);

      expect(res.body).toEqual([{ id: "ticket-101", userId: "user-123" }]);
      expect(mockService.getMyBookings).toHaveBeenCalledWith("user-123");
      expect(mockService.getShowtimeDetails).not.toHaveBeenCalled();
    });

    it("GET /showtimes/my-tickets resolves to getMyTickets and does not trigger getShowtimeDetails", async () => {
      const res = await request(app.getHttpServer())
        .get("/showtimes/my-tickets")
        .expect(200);

      expect(res.body).toEqual([{ id: "ticket-101", userId: "user-123" }]);
      expect(mockService.getMyBookings).toHaveBeenCalledWith("user-123");
      expect(mockService.getShowtimeDetails).not.toHaveBeenCalled();
    });

    it("GET /booking/:id still properly resolves to getShowtimeDetails for normal showtime IDs", async () => {
      const res = await request(app.getHttpServer())
        .get("/booking/showtime-abc-123")
        .expect(200);

      expect(res.body).toEqual({ id: "showtime-abc-123", title: "Test Movie" });
      expect(mockService.getShowtimeDetails).toHaveBeenCalledWith("showtime-abc-123");
    });
  });
});
