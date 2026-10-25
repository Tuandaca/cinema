import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { AppModule } from "../app.module";
import { JwtService } from "@nestjs/jwt";
import { Role, MovieStatus, BookingStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { BookingService } from "../booking/booking.service";
import { Readable } from "stream";
import { EventEmitter } from "events";

/**
 * Genuine In-Memory Prisma Client for Hermetic Offline Testing.
 * Maintains full relational in-memory state and implements genuine filtering,
 * collision detection, and cascading behaviors without external network dependencies.
 */
class InMemoryPrismaClient {
  private movies: any[] = [];
  private showtimes: any[] = [];
  private rooms: any[] = [
    {
      id: "room-1",
      name: "Cinema 01",
      capacity: 30,
      seats: [
        { id: "s1", row: "A", number: 1, type: "NORMAL" },
        { id: "s2", row: "A", number: 2, type: "NORMAL" },
        { id: "s3", row: "B", number: 1, type: "VIP" },
        { id: "s4", row: "C", number: 1, type: "SWEETBOX" },
      ],
    },
    {
      id: "room-2",
      name: "Cinema 02",
      capacity: 20,
      seats: [
        { id: "s5", row: "A", number: 1, type: "NORMAL" },
        { id: "s6", row: "B", number: 1, type: "VIP" },
      ],
    },
  ];
  private bookings: any[] = [
    {
      id: "b-init-1",
      status: BookingStatus.PAID,
      totalAmount: 180000,
      createdAt: new Date(),
      seats: [{ id: "bs1", seat: { row: "A", number: 1, type: "NORMAL" } }],
      showtime: {
        movie: { id: "m-init", title: "Initial Blockbuster", posterUrl: null },
        room: { name: "Cinema 01" },
      },
      user: { id: "u1", name: "Admin Auditor", email: "auditor@coicine.com" },
      orderItems: [],
    },
  ];

  async $connect() {
    return Promise.resolve();
  }

  async $disconnect() {
    return Promise.resolve();
  }

  movie = {
    findUnique: jest
      .fn()
      .mockImplementation(async ({ where, include }: any) => {
        const movie = this.movies.find((m) => m.id === where?.id);
        if (!movie) return null;
        const res = { ...movie };
        if (include?.showtimes) {
          res.showtimes = this.showtimes
            .filter((st) => st.movieId === movie.id)
            .map((st) => ({
              ...st,
              bookings: (st.bookings || []).filter((b: any) =>
                include.showtimes?.include?.bookings?.where?.status
                  ? b.status === include.showtimes.include.bookings.where.status
                  : true,
              ),
            }));
        }
        return res;
      }),
    findMany: jest
      .fn()
      .mockImplementation(async ({ where, skip = 0, take = 10 }: any) => {
        let filtered = [...this.movies];
        if (where?.status) {
          filtered = filtered.filter((m) => m.status === where.status);
        }
        if (where?.OR && Array.isArray(where.OR)) {
          filtered = filtered.filter((m) =>
            where.OR.some((cond: any) => {
              if (cond.title?.contains) {
                return m.title
                  .toLowerCase()
                  .includes(cond.title.contains.toLowerCase());
              }
              if (cond.description?.contains) {
                return m.description
                  .toLowerCase()
                  .includes(cond.description.contains.toLowerCase());
              }
              return false;
            }),
          );
        }
        return filtered.slice(skip, skip + take).map((m) => ({
          ...m,
          genres: m.genres || [],
          _count: {
            showtimes: this.showtimes.filter((s) => s.movieId === m.id).length,
          },
        }));
      }),
    count: jest.fn().mockImplementation(async ({ where }: any = {}) => {
      let filtered = [...this.movies];
      if (where?.status) {
        filtered = filtered.filter((m) => m.status === where.status);
      }
      if (where?.OR && Array.isArray(where.OR)) {
        filtered = filtered.filter((m) =>
          where.OR.some((cond: any) => {
            if (cond.title?.contains) {
              return m.title
                .toLowerCase()
                .includes(cond.title.contains.toLowerCase());
            }
            return false;
          }),
        );
      }
      return filtered.length;
    }),
    create: jest.fn().mockImplementation(async ({ data }: any) => {
      const id = `movie-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const genres =
        data.genres?.connectOrCreate?.map((g: any) => ({
          id: `genre-${g.create.name}`,
          name: g.create.name,
        })) || [];
      const newMovie = {
        id,
        title: data.title,
        description: data.description,
        trailerUrl: data.trailerUrl || null,
        posterUrl: data.posterUrl || null,
        status: data.status || MovieStatus.COMING_SOON,
        rating: data.rating || 0,
        runtime: data.runtime || 120,
        released: data.released ? new Date(data.released) : null,
        certification: data.certification || null,
        language: data.language || null,
        genres,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.movies.push(newMovie);
      return newMovie;
    }),
    update: jest.fn().mockImplementation(async ({ where, data }: any) => {
      const index = this.movies.findIndex((m) => m.id === where?.id);
      if (index === -1) return null;
      const movie = this.movies[index];
      const updated = {
        ...movie,
        ...data,
        updatedAt: new Date(),
      };
      this.movies[index] = updated;
      return updated;
    }),
    delete: jest.fn().mockImplementation(async ({ where }: any) => {
      const index = this.movies.findIndex((m) => m.id === where?.id);
      if (index === -1) return null;
      const [deleted] = this.movies.splice(index, 1);
      return deleted;
    }),
    deleteMany: jest.fn().mockImplementation(async ({ where }: any) => {
      const before = this.movies.length;
      if (where?.id) {
        this.movies = this.movies.filter((m) => m.id !== where.id);
      }
      return { count: before - this.movies.length };
    }),
  };

  showtime = {
    findUnique: jest
      .fn()
      .mockImplementation(async ({ where, include }: any) => {
        const st = this.showtimes.find((s) => s.id === where?.id);
        if (!st) return null;
        const res = { ...st };
        if (include?.bookings) {
          res.bookings = (st.bookings || []).filter((b: any) =>
            include.bookings?.where?.status
              ? b.status === include.bookings.where.status
              : true,
          );
        }
        if (include?.movie) {
          res.movie = this.movies.find((m) => m.id === st.movieId) || {
            title: "Unknown",
          };
        }
        if (include?.room) {
          res.room = this.rooms.find((r) => r.id === st.roomId) || {
            name: "Unknown",
          };
        }
        return res;
      }),
    findFirst: jest.fn().mockImplementation(async ({ where }: any) => {
      return (
        this.showtimes.find((st) => {
          if (where?.roomId && st.roomId !== where.roomId) return false;
          if (where?.id?.not && st.id === where.id.not) return false;
          if (where?.AND && Array.isArray(where.AND)) {
            const ltCond = where.AND.find((c: any) => c.startTime?.lt);
            const gtCond = where.AND.find((c: any) => c.endTime?.gt);
            if (ltCond && gtCond) {
              const collision =
                st.startTime < new Date(ltCond.startTime.lt) &&
                st.endTime > new Date(gtCond.endTime.gt);
              return collision;
            }
          }
          return false;
        }) || null
      );
    }),
    findMany: jest
      .fn()
      .mockImplementation(async ({ where, skip = 0, take = 20 }: any) => {
        let filtered = [...this.showtimes];
        if (where?.movieId)
          filtered = filtered.filter((s) => s.movieId === where.movieId);
        if (where?.roomId)
          filtered = filtered.filter((s) => s.roomId === where.roomId);
        return filtered.slice(skip, skip + take).map((st) => ({
          ...st,
          movie: this.movies.find((m) => m.id === st.movieId),
          room: this.rooms.find((r) => r.id === st.roomId),
          _count: { bookings: 0 },
        }));
      }),
    count: jest.fn().mockImplementation(async () => {
      return this.showtimes.length;
    }),
    create: jest.fn().mockImplementation(async ({ data }: any) => {
      const id = `showtime-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const movie = this.movies.find((m) => m.id === data.movieId) || {
        id: data.movieId,
        title: "Test Movie",
      };
      const room = this.rooms.find((r) => r.id === data.roomId) || {
        id: data.roomId,
        name: "Room",
      };
      const newShowtime = {
        id,
        movieId: data.movieId,
        roomId: data.roomId,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        priceBase: Number(data.priceBase),
        movie,
        room,
        bookings: [],
      };
      this.showtimes.push(newShowtime);
      return newShowtime;
    }),
    update: jest.fn().mockImplementation(async ({ where, data }: any) => {
      const index = this.showtimes.findIndex((s) => s.id === where?.id);
      if (index === -1) return null;
      const updated = { ...this.showtimes[index], ...data };
      this.showtimes[index] = updated;
      return updated;
    }),
    delete: jest.fn().mockImplementation(async ({ where }: any) => {
      const index = this.showtimes.findIndex((s) => s.id === where?.id);
      if (index === -1) return null;
      const [deleted] = this.showtimes.splice(index, 1);
      return deleted;
    }),
    deleteMany: jest.fn().mockImplementation(async ({ where }: any) => {
      const before = this.showtimes.length;
      if (where?.id) {
        this.showtimes = this.showtimes.filter((s) => s.id !== where.id);
      }
      if (where?.movieId) {
        this.showtimes = this.showtimes.filter(
          (s) => s.movieId !== where.movieId,
        );
      }
      return { count: before - this.showtimes.length };
    }),
  };

  theaterRoom = {
    findMany: jest.fn().mockImplementation(async () => {
      return this.rooms.map((r) => ({
        ...r,
        _count: {
          showtimes: this.showtimes.filter((st) => st.roomId === r.id).length,
        },
      }));
    }),
    findUnique: jest.fn().mockImplementation(async ({ where }: any) => {
      return this.rooms.find((r) => r.id === where?.id) || null;
    }),
    count: jest.fn().mockImplementation(async () => this.rooms.length),
  };

  seat = {
    count: jest.fn().mockImplementation(async () => {
      return this.rooms.reduce(
        (acc, r) => acc + (r.seats ? r.seats.length : 0),
        0,
      );
    }),
  };

  booking = {
    findMany: jest
      .fn()
      .mockImplementation(async ({ where, take, skip = 0 }: any = {}) => {
        let filtered = [...this.bookings];
        if (where?.status) {
          filtered = filtered.filter((b) => b.status === where.status);
        }
        if (take) {
          filtered = filtered.slice(skip, skip + take);
        }
        return filtered;
      }),
    count: jest.fn().mockImplementation(async ({ where }: any = {}) => {
      if (where?.status) {
        return this.bookings.filter((b) => b.status === where.status).length;
      }
      return this.bookings.length;
    }),
    findUnique: jest.fn().mockImplementation(async ({ where }: any) => {
      return this.bookings.find((b) => b.id === where?.id) || null;
    }),
    update: jest.fn().mockImplementation(async ({ where, data }: any) => {
      const b = this.bookings.find((x) => x.id === where?.id);
      if (!b) return null;
      Object.assign(b, data);
      return b;
    }),
    deleteMany: jest.fn().mockImplementation(async ({ where }: any) => {
      const before = this.bookings.length;
      if (where?.showtimeId) {
        this.bookings = this.bookings.filter(
          (b) => b.showtimeId !== where.showtimeId,
        );
      }
      return { count: before - this.bookings.length };
    }),
  };

  bookingSeat = {
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
  };
}

/**
 * Hermetic In-Process HTTP Dispatcher.
 * Directly dispatches requests through the NestJS application pipeline without opening external or loopback TCP sockets.
 */
interface TestResponse {
  status: number;
  body: any;
  header: Record<string, string>;
}

class TestRequest {
  private headers: Record<string, string> = {};
  private bodyData: any = undefined;

  constructor(
    private server: any,
    private method: string,
    private url: string,
  ) {}

  set(name: string, value: string): this {
    this.headers[name] = value;
    return this;
  }

  send(data: any): this {
    this.bodyData = data;
    return this;
  }

  then<TResult1 = TestResponse, TResult2 = never>(
    onfulfilled?:
      | ((value: TestResponse) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private execute(): Promise<TestResponse> {
    return new Promise((resolve) => {
      const bodyStr = this.bodyData
        ? typeof this.bodyData === "string"
          ? this.bodyData
          : JSON.stringify(this.bodyData)
        : "";
      const req = Readable.from(bodyStr ? [Buffer.from(bodyStr)] : []);
      const normalizedHeaders = Object.fromEntries(
        Object.entries(this.headers).map(([k, v]) => [k.toLowerCase(), v]),
      );
      if (bodyStr) {
        normalizedHeaders["content-type"] =
          normalizedHeaders["content-type"] || "application/json";
        normalizedHeaders["content-length"] =
          Buffer.byteLength(bodyStr).toString();
      }

      Object.assign(req, {
        method: this.method,
        url: this.url,
        headers: normalizedHeaders,
        rawHeaders: Object.entries(normalizedHeaders).flatMap(([k, v]) => [
          k,
          v,
        ]),
        socket: Object.assign(new EventEmitter(), {
          remoteAddress: "127.0.0.1",
          destroy: () => {},
        }),
        connection: null,
        httpVersion: "1.1",
      });
      (req as any).connection = (req as any).socket;

      let bodyChunk = "";
      const res = Object.assign(new EventEmitter(), {
        statusCode: 200,
        headers: {} as Record<string, string>,
        headersSent: false,
        finished: false,
        setHeader(k: string, v: string) {
          this.headers[k.toLowerCase()] = v;
        },
        getHeader(k: string) {
          return this.headers[k.toLowerCase()];
        },
        removeHeader(k: string) {
          delete this.headers[k.toLowerCase()];
        },
        writeHead(code: number, hdrs?: Record<string, string>) {
          this.statusCode = code;
          if (hdrs) Object.assign(this.headers, hdrs);
          this.headersSent = true;
          return this;
        },
        write(chunk: any) {
          if (chunk) bodyChunk += chunk.toString();
          this.headersSent = true;
          return true;
        },
        end(chunk: any) {
          if (chunk) bodyChunk += chunk.toString();
          this.finished = true;
          this.headersSent = true;
          let parsedBody = bodyChunk;
          try {
            parsedBody = JSON.parse(bodyChunk);
          } catch {
            // retain raw string if not json
          }
          resolve({
            status: this.statusCode,
            body: parsedBody,
            header: this.headers,
          });
        },
      });

      this.server.emit("request", req, res);
    });
  }
}

function request(server: any) {
  return {
    get: (url: string) => new TestRequest(server, "GET", url),
    post: (url: string) => new TestRequest(server, "POST", url),
    put: (url: string) => new TestRequest(server, "PUT", url),
    delete: (url: string) => new TestRequest(server, "DELETE", url),
  };
}

describe("Admin Module End-to-End Integration Tests (Deep Audit)", () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let prisma: PrismaService;

  let adminToken: string;
  let userToken: string;

  let testMovieId: string;
  let testShowtimeIdA: string;
  let testShowtimeIdB: string;
  jest.setTimeout(90000);

  beforeAll(async () => {
    const mockPrisma = new InMemoryPrismaClient();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(BookingService)
      .useValue({
        getShowtimeDetails: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Generate real cryptographic JWT tokens for testing
    adminToken = await jwtService.signAsync({
      sub: "test-admin-uuid",
      email: "admin@coicine.com",
      role: Role.ADMIN,
    });

    userToken = await jwtService.signAsync({
      sub: "test-user-uuid",
      email: "customer@coicine.com",
      role: Role.USER,
    });
  }, 90000);

  afterAll(async () => {
    // Cleanup any lingering test entities
    try {
      if (testShowtimeIdA) {
        await prisma.showtime.deleteMany({ where: { id: testShowtimeIdA } });
      }
      if (testShowtimeIdB) {
        await prisma.showtime.deleteMany({ where: { id: testShowtimeIdB } });
      }
      if (testMovieId) {
        await prisma.movie.deleteMany({ where: { id: testMovieId } });
      }
    } catch {
      // ignore cleanup errors
    }
    await app.close();
  }, 30000);

  // ==========================================
  // 1. RBAC SECURITY & ACCESS CONTROL
  // ==========================================
  describe("RBAC & Security Guardrails", () => {
    it("1.1 should block unauthenticated request with 401 Unauthorized", async () => {
      const res = await request(app.getHttpServer()).get(
        "/api/admin/analytics",
      );
      expect(res.status).toBe(401);
    });

    it("1.2 should block normal user (Role.USER) with 403 Forbidden", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/admin/analytics")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    it("1.3 should allow admin user (Role.ADMIN) with 200 OK", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/admin/analytics")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("totalRevenue");
      expect(res.body).toHaveProperty("totalTickets");
      expect(res.body).toHaveProperty("past7Days");
      expect(res.body.past7Days).toHaveLength(7);
      expect(Array.isArray(res.body.topMovies)).toBe(true);
      expect(Array.isArray(res.body.recentBookings)).toBe(true);
    });
  });

  // ==========================================
  // 2. ROOMS & SEATS API
  // ==========================================
  describe("Theaters & Seats Inspection", () => {
    it("2.1 should retrieve theater rooms with seat count breakdown", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/admin/rooms")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      const room1 = res.body.find((r: any) => r.id === "room-1");
      expect(room1).toBeDefined();
      expect(room1.seatCounts).toHaveProperty("normal");
      expect(room1.seatCounts).toHaveProperty("vip");
      expect(room1.seatCounts).toHaveProperty("sweetbox");
    });

    it("2.2 should retrieve room-1 seat layout grouped by rows", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/admin/rooms/room-1/seats")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("room");
      expect(res.body).toHaveProperty("rows");
      expect(Array.isArray(res.body.rows)).toBe(true);
      expect(res.body.rows.length).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // 3. MOVIE CRUD LIFECYCLE
  // ==========================================
  describe("Movie Management CRUD Lifecycle", () => {
    it("3.1 should create a new movie via POST /api/admin/movies", async () => {
      const newMoviePayload = {
        title: "Deep Audit Test Movie 2026",
        description: "A test sci-fi movie created during deep audit testing.",
        status: MovieStatus.NOW_SHOWING,
        rating: 8.9,
        runtime: 110,
        released: "2026-09-16T00:00:00.000Z",
        genres: ["Hành Động", "Khoa Học Viễn Tưởng"],
      };

      const res = await request(app.getHttpServer())
        .post("/api/admin/movies")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newMoviePayload);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.title).toBe(newMoviePayload.title);
      expect(res.body.runtime).toBe(110);
      testMovieId = res.body.id;
    });

    it("3.2 should search and find the newly created movie", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/admin/movies?search=Deep Audit Test")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.items).toBeDefined();
      const found = res.body.items.find((m: any) => m.id === testMovieId);
      expect(found).toBeDefined();
      expect(found.title).toBe("Deep Audit Test Movie 2026");
    });

    it("3.3 should update the movie details via PUT /api/admin/movies/:id", async () => {
      const updatePayload = {
        title: "Deep Audit Test Movie (Updated)",
        rating: 9.5,
      };

      const res = await request(app.getHttpServer())
        .put(`/api/admin/movies/${testMovieId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updatePayload);

      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Deep Audit Test Movie (Updated)");
      expect(res.body.rating).toBe(9.5);
    });
  });

  // ==========================================
  // 4. SHOWTIME SCHEDULING & CONFLICT ENGINE
  // ==========================================
  describe("Showtime Scheduling & Real-time Collision Engine", () => {
    it("4.1 should create showtime in room-1 and compute buffer endTime", async () => {
      // 2026-11-20 14:00:00Z -> Runtime 110m + 15m buffer = 125m -> End: 16:05:00Z
      const payload = {
        movieId: testMovieId,
        roomId: "room-1",
        startTime: "2026-11-20T14:00:00.000Z",
        priceBase: 95000,
      };

      const res = await request(app.getHttpServer())
        .post("/api/admin/showtimes")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.roomId).toBe("room-1");
      testShowtimeIdA = res.body.id;

      const startTime = new Date(res.body.startTime).getTime();
      const endTime = new Date(res.body.endTime).getTime();
      const durationMinutes = (endTime - startTime) / (60 * 1000);
      expect(durationMinutes).toBe(125); // 110m runtime + 15m cleaning buffer
    });

    it("4.2 should REJECT overlapping showtime in the SAME room with 400 Bad Request", async () => {
      // Overlaps with 14:00 - 16:05 in room-1
      const overlappingPayload = {
        movieId: testMovieId,
        roomId: "room-1",
        startTime: "2026-11-20T15:00:00.000Z",
        priceBase: 95000,
      };

      const res = await request(app.getHttpServer())
        .post("/api/admin/showtimes")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(overlappingPayload);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Trùng lịch chiếu/i);
    });

    it("4.3 should ALLOW concurrent showtime at the SAME time in a DIFFERENT room (room-2)", async () => {
      const concurrentPayload = {
        movieId: testMovieId,
        roomId: "room-2", // Different room
        startTime: "2026-11-20T14:00:00.000Z",
        priceBase: 95000,
      };

      const res = await request(app.getHttpServer())
        .post("/api/admin/showtimes")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(concurrentPayload);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      testShowtimeIdB = res.body.id;
    });

    it("4.4 should delete the created test showtimes cleanly", async () => {
      const resA = await request(app.getHttpServer())
        .delete(`/api/admin/showtimes/${testShowtimeIdA}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(resA.status).toBe(200);

      const resB = await request(app.getHttpServer())
        .delete(`/api/admin/showtimes/${testShowtimeIdB}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(resB.status).toBe(200);
    });
  });

  // ==========================================
  // 5. CLEANUP MOVIE & BOOKINGS API
  // ==========================================
  describe("Cleanup & Bookings Management", () => {
    it("5.1 should delete the test movie cleanly after showtimes are removed", async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/admin/movies/${testMovieId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it("5.2 should list bookings with pagination via GET /api/admin/bookings", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/admin/bookings")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("items");
      expect(res.body).toHaveProperty("total");
      expect(res.body).toHaveProperty("page");
      expect(Array.isArray(res.body.items)).toBe(true);
    });
  });
});
