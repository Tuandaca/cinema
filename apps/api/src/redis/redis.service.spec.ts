import { Test, TestingModule } from "@nestjs/testing";
import { RedisService } from "./redis.service";

describe("RedisService", () => {
  let service: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisService],
    }).compile();

    service = module.get<RedisService>(RedisService);
    // Explicitly clear memory cache before each test
    (service as any).memoryCache.clear();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("In-memory Fallback Cache Mode (Redis unavailable)", () => {
    beforeEach(() => {
      // Force Redis unavailable state
      (service as any).redisAvailable = false;
    });

    it("should report availability as false", () => {
      expect(service.isAvailable()).toBe(false);
    });

    it("should return null for non-existent key", async () => {
      const result = await service.get("non-existent-key");
      expect(result).toBeNull();
    });

    it("should store and retrieve string, object, and array values in memory", async () => {
      await service.set("test:string", "hello world");
      expect(await service.get<string>("test:string")).toBe("hello world");

      const user = { id: "u1", name: "Alice", roles: ["USER"] };
      await service.set("test:object", user);
      expect(await service.get<typeof user>("test:object")).toEqual(user);

      const items = [1, 2, 3, 4];
      await service.set("test:array", items);
      expect(await service.get<number[]>("test:array")).toEqual(items);
    });

    it("should respect TTL expiration in memory fallback", async () => {
      jest.useFakeTimers();

      await service.set("test:expiring", { active: true }, 10); // 10 seconds
      expect(await service.get("test:expiring")).toEqual({ active: true });

      // Advance time by 9 seconds -> still available
      jest.advanceTimersByTime(9000);
      expect(await service.get("test:expiring")).toEqual({ active: true });

      // Advance time by 2 more seconds (total 11s) -> expired
      jest.advanceTimersByTime(2000);
      expect(await service.get("test:expiring")).toBeNull();

      jest.useRealTimers();
    });

    it("should delete keys from memory cache with del()", async () => {
      await service.set("test:delete", "to-be-deleted");
      expect(await service.get("test:delete")).toBe("to-be-deleted");

      await service.del("test:delete");
      expect(await service.get("test:delete")).toBeNull();
    });

    it("should delete matching keys with delPattern() and retain non-matching keys", async () => {
      await service.set("movies:list:all:1:20", [{ id: "1" }]);
      await service.set("movies:list:action:1:10", [{ id: "2" }]);
      await service.set("movies:detail:1", { id: "1", title: "Movie 1" });
      await service.set("movies:showtimes:1", [{ id: "st1" }]);

      await service.delPattern("movies:list:*");

      expect(await service.get("movies:list:all:1:20")).toBeNull();
      expect(await service.get("movies:list:action:1:10")).toBeNull();
      expect(await service.get("movies:detail:1")).toEqual({
        id: "1",
        title: "Movie 1",
      });
      expect(await service.get("movies:showtimes:1")).toEqual([{ id: "st1" }]);
    });
  });

  describe("Live / Mocked Redis Mode", () => {
    let mockRedis: any;

    beforeEach(() => {
      mockRedis = {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        scan: jest.fn(),
      };
      (service as any).redis = mockRedis;
      (service as any).redisAvailable = true;
    });

    it("should report availability as true", () => {
      expect(service.isAvailable()).toBe(true);
    });

    it("should get parsed JSON data from Redis", async () => {
      const data = { id: "m1", title: "Interstellar" };
      mockRedis.get.mockResolvedValue(JSON.stringify(data));

      const result = await service.get("movies:detail:m1");
      expect(mockRedis.get).toHaveBeenCalledWith("movies:detail:m1");
      expect(result).toEqual(data);
    });

    it("should return null when Redis returns null", async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await service.get("movies:detail:m2");
      expect(result).toBeNull();
    });

    it("should set data into Redis with TTL", async () => {
      mockRedis.set.mockResolvedValue("OK");

      await service.set("movies:detail:m1", { title: "Dune" }, 3600);

      expect(mockRedis.set).toHaveBeenCalledWith(
        "movies:detail:m1",
        JSON.stringify({ title: "Dune" }),
        "EX",
        3600,
      );
    });

    it("should set data into Redis without TTL if not provided", async () => {
      mockRedis.set.mockResolvedValue("OK");

      await service.set("config:key", { dark: true });

      expect(mockRedis.set).toHaveBeenCalledWith(
        "config:key",
        JSON.stringify({ dark: true }),
      );
    });

    it("should delete key in Redis and memory", async () => {
      mockRedis.del.mockResolvedValue(1);

      await service.del("movies:detail:m1");

      expect(mockRedis.del).toHaveBeenCalledWith("movies:detail:m1");
    });

    it("should scan and delete matching keys in Redis via delPattern", async () => {
      mockRedis.scan
        .mockResolvedValueOnce([
          "10",
          ["movies:list:all:1:20", "movies:list:action:1:10"],
        ])
        .mockResolvedValueOnce(["0", ["movies:list:drama:1:10"]]);
      mockRedis.del.mockResolvedValue(1);

      await service.delPattern("movies:list:*");

      expect(mockRedis.scan).toHaveBeenCalledTimes(2);
      expect(mockRedis.del).toHaveBeenCalledWith(
        "movies:list:all:1:20",
        "movies:list:action:1:10",
      );
      expect(mockRedis.del).toHaveBeenCalledWith("movies:list:drama:1:10");
    });
  });

  describe("Resilience and Automatic Fallback on Redis Errors", () => {
    let mockRedis: any;

    beforeEach(() => {
      mockRedis = {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        scan: jest.fn(),
      };
      (service as any).redis = mockRedis;
      (service as any).redisAvailable = true;
    });

    it("should gracefully fallback to memory cache if redis.get throws network error", async () => {
      // Seed memory cache first
      (service as any).setToMemory("fallback:key", "memory-cached-value");

      mockRedis.get.mockRejectedValue(new Error("ECONNRESET connection lost"));

      const result = await service.get("fallback:key");

      expect(result).toBe("memory-cached-value");
      expect(service.isAvailable()).toBe(false);
    });

    it("should gracefully fallback to memory cache if redis.set throws network error", async () => {
      mockRedis.set.mockRejectedValue(new Error("ETIMEDOUT"));

      await expect(
        service.set("fallback:key", { test: true }, 60),
      ).resolves.not.toThrow();

      expect(service.isAvailable()).toBe(false);
      // Data should be stored in memory cache
      expect(await service.get("fallback:key")).toEqual({ test: true });
    });

    it("should gracefully handle redis.del error without throwing", async () => {
      mockRedis.del.mockRejectedValue(new Error("ENOTFOUND redis host"));

      await expect(service.del("any:key")).resolves.not.toThrow();
      expect(service.isAvailable()).toBe(false);
    });

    it("should gracefully handle redis.delPattern error without throwing", async () => {
      mockRedis.scan.mockRejectedValue(new Error("Connection closed"));

      await expect(service.delPattern("movies:*")).resolves.not.toThrow();
      expect(service.isAvailable()).toBe(false);
    });
  });
});
