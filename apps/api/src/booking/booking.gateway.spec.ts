import { Test, TestingModule } from "@nestjs/testing";
import { BookingGateway } from "./booking.gateway";
import { BookingService } from "./booking.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

describe("BookingGateway", () => {
  let gateway: BookingGateway;
  let bookingService: any;
  let mockServer: any;

  const mockShowtimeId = "showtime-101";
  const mockUserId = "user-alice-1";

  beforeEach(async () => {
    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    bookingService = {
      softLockSeat: jest.fn().mockResolvedValue(true),
      releaseSoftLockSeat: jest.fn().mockResolvedValue(undefined),
      releaseAllUserLocks: jest.fn().mockResolvedValue([]),
      releaseUserShowtimeSoftLocks: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingGateway,
        { provide: BookingService, useValue: bookingService },
        { provide: JwtService, useValue: {} },
        { provide: ConfigService, useValue: {} },
      ],
    }).compile();

    gateway = module.get<BookingGateway>(BookingGateway);
    gateway.server = mockServer;
  });

  it("should be defined", () => {
    expect(gateway).toBeDefined();
  });

  describe("handleConnection & handleJoinShowtime", () => {
    it("should handle join_showtime and track user socket accurately", () => {
      const mockClient: any = {
        id: "socket-1",
        data: { user: { sub: mockUserId } },
        join: jest.fn(),
      };

      const result = gateway.handleJoinShowtime(
        { showtimeId: mockShowtimeId },
        mockClient,
      );

      expect(mockClient.join).toHaveBeenCalledWith(mockShowtimeId);
      expect(result).toEqual({ event: "joined", data: mockShowtimeId });

      // Check internal userSockets mapping
      const userSockets = (gateway as any).userSockets.get(mockUserId);
      expect(userSockets).toBeDefined();
      expect(userSockets.has("socket-1")).toBe(true);
      expect(userSockets.size).toBe(1);
    });

    it("should not duplicate socket count if same socket joins multiple times", () => {
      const mockClient: any = {
        id: "socket-1",
        data: { user: { sub: mockUserId } },
        join: jest.fn(),
      };

      gateway.handleJoinShowtime({ showtimeId: mockShowtimeId }, mockClient);
      gateway.handleJoinShowtime({ showtimeId: mockShowtimeId }, mockClient);

      const userSockets = (gateway as any).userSockets.get(mockUserId);
      expect(userSockets.size).toBe(1);
    });

    it("should reject join_showtime with invalid showtimeId", () => {
      const mockClient: any = {
        id: "socket-1",
        data: { user: { sub: mockUserId } },
        join: jest.fn(),
      };

      const result = gateway.handleJoinShowtime(
        { showtimeId: "" },
        mockClient,
      );

      expect(result).toEqual({ event: "error", data: "Invalid showtimeId" });
      expect(mockClient.join).not.toHaveBeenCalled();
    });

    it("should reject join_showtime if client has no verified user", () => {
      const mockClient: any = {
        id: "socket-1",
        data: {},
        join: jest.fn(),
      };

      const result = gateway.handleJoinShowtime(
        { showtimeId: mockShowtimeId },
        mockClient,
      );

      expect(result).toEqual({ event: "error", data: "Unauthorized" });
      expect(mockClient.join).not.toHaveBeenCalled();
    });
  });

  describe("handleLeaveShowtime", () => {
    it("should leave showtime room cleanly and release user showtime soft-locks with broadcast", async () => {
      const mockClient: any = {
        id: "socket-1",
        data: { user: { sub: mockUserId } },
        leave: jest.fn(),
      };

      bookingService.releaseUserShowtimeSoftLocks.mockResolvedValueOnce(["seat-A1"]);

      await gateway.handleLeaveShowtime({ showtimeId: mockShowtimeId }, mockClient);
      expect(mockClient.leave).toHaveBeenCalledWith(mockShowtimeId);
      expect(bookingService.releaseUserShowtimeSoftLocks).toHaveBeenCalledWith(
        mockShowtimeId,
        mockUserId,
      );
      expect(mockServer.to).toHaveBeenCalledWith(mockShowtimeId);
      expect(mockServer.emit).toHaveBeenCalledWith("seat_deselected", {
        seatId: "seat-A1",
        userId: mockUserId,
      });
    });

    it("should ignore invalid showtimeId without crashing", async () => {
      const mockClient: any = {
        id: "socket-1",
        leave: jest.fn(),
      };

      await gateway.handleLeaveShowtime({ showtimeId: "   " } as any, mockClient);
      expect(mockClient.leave).not.toHaveBeenCalled();
    });
  });

  describe("handleSelectSeat", () => {
    it("should soft-lock seat, broadcast to room and notify client on success", async () => {
      const mockClient: any = {
        id: "socket-1",
        data: { user: { sub: mockUserId } },
        to: jest.fn().mockReturnValue({ emit: jest.fn() }),
        emit: jest.fn(),
      };

      bookingService.softLockSeat.mockResolvedValueOnce(true);

      await gateway.handleSelectSeat(
        { showtimeId: mockShowtimeId, seatId: "seat-A1" },
        mockClient,
      );

      expect(bookingService.softLockSeat).toHaveBeenCalledWith(
        mockShowtimeId,
        "seat-A1",
        mockUserId,
      );
      expect(mockClient.to).toHaveBeenCalledWith(mockShowtimeId);
      expect(mockClient.emit).toHaveBeenCalledWith("select_seat_success", {
        showtimeId: mockShowtimeId,
        seatId: "seat-A1",
        userId: mockUserId,
      });
    });

    it("should emit select_seat_failed to client if soft-lock was not acquired", async () => {
      const mockClient: any = {
        id: "socket-1",
        data: { user: { sub: mockUserId } },
        emit: jest.fn(),
      };

      bookingService.softLockSeat.mockResolvedValueOnce(false);

      await gateway.handleSelectSeat(
        { showtimeId: mockShowtimeId, seatId: "seat-A1" },
        mockClient,
      );

      expect(mockClient.emit).toHaveBeenCalledWith("select_seat_failed", {
        showtimeId: mockShowtimeId,
        seatId: "seat-A1",
        userId: mockUserId,
      });
    });

    it("should reject select_seat on invalid input", async () => {
      const mockClient: any = {
        id: "socket-1",
        data: { user: { sub: mockUserId } },
        emit: jest.fn(),
      };

      await gateway.handleSelectSeat(
        { showtimeId: "", seatId: "" },
        mockClient,
      );

      expect(mockClient.emit).toHaveBeenCalledWith("select_seat_failed", {
        showtimeId: "",
        seatId: "",
        reason: "Invalid input",
      });
      expect(bookingService.softLockSeat).not.toHaveBeenCalled();
    });
  });

  describe("handleDeselectSeat", () => {
    it("should release soft-lock and broadcast seat_deselected to room", async () => {
      const mockClient: any = {
        id: "socket-1",
        data: { user: { sub: mockUserId } },
        to: jest.fn().mockReturnValue({ emit: jest.fn() }),
      };

      await gateway.handleDeselectSeat(
        { showtimeId: mockShowtimeId, seatId: "seat-A1" },
        mockClient,
      );

      expect(bookingService.releaseSoftLockSeat).toHaveBeenCalledWith(
        mockShowtimeId,
        "seat-A1",
        mockUserId,
      );
      expect(mockClient.to).toHaveBeenCalledWith(mockShowtimeId);
    });

    it("should ignore invalid or whitespace-only input without throwing", async () => {
      const mockClient: any = {
        id: "socket-1",
        data: { user: { sub: mockUserId } },
      };

      await gateway.handleDeselectSeat({ showtimeId: "   ", seatId: "   " }, mockClient);
      expect(bookingService.releaseSoftLockSeat).not.toHaveBeenCalled();
    });
  });

  describe("handleDisconnect and Multi-Socket Cleanup", () => {
    it("should release all locks and broadcast seat_deselected for all released seats when single socket disconnects", async () => {
      const mockClient: any = {
        id: "socket-1",
        data: { user: { sub: mockUserId } },
        join: jest.fn(),
      };

      // User joins
      gateway.handleJoinShowtime({ showtimeId: mockShowtimeId }, mockClient);

      // Mock released locks
      bookingService.releaseAllUserLocks.mockResolvedValueOnce([
        { showtimeId: mockShowtimeId, seatId: "seat-A1", type: "softlock" },
        { showtimeId: mockShowtimeId, seatId: "seat-A2", type: "lock" },
      ]);

      // Client disconnects
      await gateway.handleDisconnect(mockClient);

      expect(bookingService.releaseAllUserLocks).toHaveBeenCalledWith(mockUserId);
      expect(mockServer.to).toHaveBeenCalledWith(mockShowtimeId);
      expect(mockServer.emit).toHaveBeenCalledWith("user_disconnected", { userId: mockUserId });
    });

    it("should keep locks active if user has other open sockets, and release when last socket disconnects", async () => {
      const client1: any = {
        id: "socket-1",
        data: { user: { sub: mockUserId } },
        join: jest.fn(),
      };
      const client2: any = {
        id: "socket-2",
        data: { user: { sub: mockUserId } },
        join: jest.fn(),
      };

      // Same user connects on two tabs
      gateway.handleJoinShowtime({ showtimeId: mockShowtimeId }, client1);
      gateway.handleJoinShowtime({ showtimeId: mockShowtimeId }, client2);

      // Disconnect first socket
      await gateway.handleDisconnect(client1);
      // Locks should NOT be released yet
      expect(bookingService.releaseAllUserLocks).not.toHaveBeenCalled();

      // Disconnect second socket
      await gateway.handleDisconnect(client2);
      // Locks should now be released
      expect(bookingService.releaseAllUserLocks).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe("notifySeatsLocked", () => {
    it("should broadcast seats_locked to showtime room", () => {
      gateway.notifySeatsLocked(mockShowtimeId, ["seat-A1"], mockUserId);
      expect(mockServer.to).toHaveBeenCalledWith(mockShowtimeId);
      expect(mockServer.emit).toHaveBeenCalledWith("seats_locked", {
        seatIds: ["seat-A1"],
        userId: mockUserId,
      });
    });
  });
});
