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

  afterEach(async () => {
    if (service) {
      await service.onModuleDestroy();
    }
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

  describe("In-Memory Seat Locking & Atomic Operations (Redis unavailable)", () => {
    beforeEach(() => {
      (service as any).redisAvailable = false;
    });

    it("should acquire lock on an unheld key", async () => {
      const acquired = await service.acquireLock("lock:showtime:seat-1", "user-1", 300);
      expect(acquired).toBe(true);
      expect(await service.getLock("lock:showtime:seat-1")).toBe("user-1");
    });

    it("should allow the same user to renew an acquired lock", async () => {
      await service.acquireLock("lock:showtime:seat-1", "user-1", 300);
      const renewed = await service.acquireLock("lock:showtime:seat-1", "user-1", 300);
      expect(renewed).toBe(true);
      expect(await service.getLock("lock:showtime:seat-1")).toBe("user-1");
    });

    it("should reject lock acquisition if key is held by another user", async () => {
      await service.acquireLock("lock:showtime:seat-1", "user-1", 300);
      const blocked = await service.acquireLock("lock:showtime:seat-1", "user-2", 300);
      expect(blocked).toBe(false);
      expect(await service.getLock("lock:showtime:seat-1")).toBe("user-1");
    });

    it("should allow lock acquisition after TTL expires in memory", async () => {
      jest.useFakeTimers();

      await service.acquireLock("lock:showtime:seat-1", "user-1", 10);
      expect(await service.getLock("lock:showtime:seat-1")).toBe("user-1");

      jest.advanceTimersByTime(11000);
      expect(await service.getLock("lock:showtime:seat-1")).toBeNull();

      const acquired = await service.acquireLock("lock:showtime:seat-1", "user-2", 10);
      expect(acquired).toBe(true);
      expect(await service.getLock("lock:showtime:seat-1")).toBe("user-2");

      jest.useRealTimers();
    });

    it("should atomically acquire multiple locks only if ALL are available", async () => {
      const keys = [
        "lock:st1:seat-A1",
        "lock:st1:seat-A2",
        "lock:st1:seat-A3",
      ];
      const acquired = await service.acquireLocks(keys, "user-1", 300);
      expect(acquired).toBe(true);

      const owners = await service.mget(keys);
      expect(owners).toEqual(["user-1", "user-1", "user-1"]);
    });

    it("should fail acquireLocks atomically if any key is held by another user", async () => {
      await service.acquireLock("lock:st1:seat-A2", "user-2", 300);

      const keys = [
        "lock:st1:seat-A1",
        "lock:st1:seat-A2",
        "lock:st1:seat-A3",
      ];
      const acquired = await service.acquireLocks(keys, "user-1", 300);
      expect(acquired).toBe(false);

      // Seat A1 and A3 must not be locked by user-1
      expect(await service.getLock("lock:st1:seat-A1")).toBeNull();
      expect(await service.getLock("lock:st1:seat-A2")).toBe("user-2");
      expect(await service.getLock("lock:st1:seat-A3")).toBeNull();
    });

    it("should release lock only when owned by the specified user", async () => {
      await service.acquireLock("lock:st1:seat-1", "user-1", 300);

      // Wrong user cannot release
      const failedRelease = await service.releaseLock("lock:st1:seat-1", "user-2");
      expect(failedRelease).toBe(false);
      expect(await service.getLock("lock:st1:seat-1")).toBe("user-1");

      // Owner can release
      const successRelease = await service.releaseLock("lock:st1:seat-1", "user-1");
      expect(successRelease).toBe(true);
      expect(await service.getLock("lock:st1:seat-1")).toBeNull();
    });

    it("should release multiple locks via releaseLocks", async () => {
      await service.acquireLock("lock:st1:s1", "user-1", 300);
      await service.acquireLock("lock:st1:s2", "user-1", 300);
      await service.acquireLock("lock:st1:s3", "user-2", 300);

      await service.releaseLocks(["lock:st1:s1", "lock:st1:s2", "lock:st1:s3"], "user-1");

      expect(await service.getLock("lock:st1:s1")).toBeNull();
      expect(await service.getLock("lock:st1:s2")).toBeNull();
      expect(await service.getLock("lock:st1:s3")).toBe("user-2"); // Still held by user-2
    });

    it("should handle soft locks and check both soft and hard locks", async () => {
      const softKey = "softlock:st1:s1";
      const hardKey = "lock:st1:s1";

      // 1. Soft lock succeeds when free
      const acquired = await service.acquireSoftLock(softKey, hardKey, "user-1", 300);
      expect(acquired).toBe(true);
      expect(await service.getLock(softKey)).toBe("user-1");

      // 2. Another user cannot soft lock
      const blocked = await service.acquireSoftLock(softKey, hardKey, "user-2", 300);
      expect(blocked).toBe(false);

      // 3. User can renew soft lock
      const renewed = await service.acquireSoftLock(softKey, hardKey, "user-1", 300);
      expect(renewed).toBe(true);

      // 4. If hard lock is held by another user, soft lock fails
      await service.acquireLock(hardKey, "user-3", 300);
      const hardBlocked = await service.acquireSoftLock(softKey, hardKey, "user-1", 300);
      expect(hardBlocked).toBe(false);
    });

    it("should return string values and nulls via mget", async () => {
      await service.acquireLock("k1", "val1", 300);
      await service.acquireLock("k3", "val3", 300);

      const res = await service.mget(["k1", "k2", "k3"]);
      expect(res).toEqual(["val1", null, "val3"]);
    });

    it("should return keys matching pattern via getKeysByPattern and filter expired", async () => {
      jest.useFakeTimers();

      await service.acquireLock("lock:st1:s1", "u1", 300);
      await service.acquireLock("lock:st1:s2", "u2", 10);
      await service.acquireLock("lock:st2:s1", "u1", 300);
      await service.acquireLock("softlock:st1:s1", "u1", 300);

      let keys = await service.getKeysByPattern("lock:st1:*");
      expect(keys.sort()).toEqual(["lock:st1:s1", "lock:st1:s2"].sort());

      // Advance time so s2 expires
      jest.advanceTimersByTime(11000);
      keys = await service.getKeysByPattern("lock:st1:*");
      expect(keys).toEqual(["lock:st1:s1"]);

      jest.useRealTimers();
    });

    describe("acquireSeatLocks (Seat Locking with Soft-lock Protection)", () => {
      it("should acquire hard locks on available seats and remove own soft-locks", async () => {
        await service.acquireSoftLock("softlock:st1:s1", "lock:st1:s1", "u1", 300);
        await service.acquireSoftLock("softlock:st1:s2", "lock:st1:s2", "u1", 300);

        const acquired = await service.acquireSeatLocks("st1", ["s1", "s2"], "u1", 300);
        expect(acquired).toBe(true);

        expect(await service.getLock("lock:st1:s1")).toBe("u1");
        expect(await service.getLock("lock:st1:s2")).toBe("u1");
        expect(await service.getLock("softlock:st1:s1")).toBeNull();
        expect(await service.getLock("softlock:st1:s2")).toBeNull();
      });

      it("should reject acquireSeatLocks if any seat is soft-locked by another user", async () => {
        await service.acquireSoftLock("softlock:st1:s1", "lock:st1:s1", "u-other", 300);

        const acquired = await service.acquireSeatLocks("st1", ["s1", "s2"], "u1", 300);
        expect(acquired).toBe(false);

        expect(await service.getLock("lock:st1:s1")).toBeNull();
        expect(await service.getLock("lock:st1:s2")).toBeNull();
        expect(await service.getLock("softlock:st1:s1")).toBe("u-other");
      });

      it("should reject acquireSeatLocks if any seat is hard-locked by another user", async () => {
        await service.acquireLock("lock:st1:s2", "u-other", 300);

        const acquired = await service.acquireSeatLocks("st1", ["s1", "s2"], "u1", 300);
        expect(acquired).toBe(false);

        expect(await service.getLock("lock:st1:s1")).toBeNull();
        expect(await service.getLock("lock:st1:s2")).toBe("u-other");
      });

      it("should allow same user to renew acquireSeatLocks", async () => {
        await service.acquireSeatLocks("st1", ["s1"], "u1", 300);
        const renewed = await service.acquireSeatLocks("st1", ["s1"], "u1", 300);
        expect(renewed).toBe(true);
        expect(await service.getLock("lock:st1:s1")).toBe("u1");
      });

      it("should actively evict expired keys using evictExpiredKeys", async () => {
        await service.set("exp-key-1", "val1", 1);
        await service.set("exp-key-2", "val2", 100);
        await service.set("exp-key-no-ttl", "val3");

        const entry = (service as any).memoryCache.get("exp-key-1");
        entry.expiresAt = Date.now() - 1000;

        const evicted = service.evictExpiredKeys();
        expect(evicted).toBe(1);
        expect((service as any).memoryCache.has("exp-key-1")).toBe(false);
        expect((service as any).memoryCache.has("exp-key-2")).toBe(true);
        expect((service as any).memoryCache.has("exp-key-no-ttl")).toBe(true);
      });

      it("should support both * and ? wildcards in getKeysByPattern in-memory", async () => {
        await service.set("lock:st1:s1", "u1", 300);
        await service.set("lock:st1:s2", "u1", 300);
        await service.set("lock:st1:s10", "u1", 300);

        const singleCharMatches = await service.getKeysByPattern("lock:st1:s?");
        expect(singleCharMatches).toContain("lock:st1:s1");
        expect(singleCharMatches).toContain("lock:st1:s2");
        expect(singleCharMatches).not.toContain("lock:st1:s10");

        const multiCharMatches = await service.getKeysByPattern("lock:st1:*");
        expect(multiCharMatches).toHaveLength(3);
      });
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
        eval: jest.fn(),
        mget: jest.fn(),
        disconnect: jest.fn(),
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

    it("should acquire lock in Redis via eval script", async () => {
      mockRedis.eval.mockResolvedValue(1);

      const acquired = await service.acquireLock("lock:st1:s1", "u1", 300);
      expect(mockRedis.eval).toHaveBeenCalled();
      expect(acquired).toBe(true);
    });

    it("should return false if Redis eval returns 0 on lock acquisition", async () => {
      mockRedis.eval.mockResolvedValue(0);

      const acquired = await service.acquireLock("lock:st1:s1", "u2", 300);
      expect(acquired).toBe(false);
    });

    it("should release lock in Redis via eval script", async () => {
      mockRedis.eval.mockResolvedValue(1);

      const released = await service.releaseLock("lock:st1:s1", "u1");
      expect(mockRedis.eval).toHaveBeenCalled();
      expect(released).toBe(true);
    });

    it("should get raw lock string via getLock", async () => {
      mockRedis.get.mockResolvedValue("u1");

      const owner = await service.getLock("lock:st1:s1");
      expect(mockRedis.get).toHaveBeenCalledWith("lock:st1:s1");
      expect(owner).toBe("u1");
    });

    it("should mget raw lock strings via mget", async () => {
      mockRedis.mget.mockResolvedValue(["u1", null]);

      const res = await service.mget(["k1", "k2"]);
      expect(mockRedis.mget).toHaveBeenCalledWith("k1", "k2");
      expect(res).toEqual(["u1", null]);
    });

    it("should scan keys matching pattern via getKeysByPattern in Redis", async () => {
      mockRedis.scan.mockResolvedValueOnce(["0", ["lock:st1:s1", "lock:st1:s2"]]);

      const keys = await service.getKeysByPattern("lock:st1:*");
      expect(mockRedis.scan).toHaveBeenCalled();
      expect(keys).toEqual(["lock:st1:s1", "lock:st1:s2"]);
    });

    it("should acquire seat locks via Redis eval script", async () => {
      mockRedis.eval.mockResolvedValue(1);

      const acquired = await service.acquireSeatLocks("st1", ["s1", "s2"], "u1", 300);
      expect(mockRedis.eval).toHaveBeenCalled();
      expect(acquired).toBe(true);
    });

    it("should return false if Redis eval returns 0 on acquireSeatLocks", async () => {
      mockRedis.eval.mockResolvedValue(0);

      const acquired = await service.acquireSeatLocks("st1", ["s1"], "u2", 300);
      expect(acquired).toBe(false);
    });

    it("should safely parse raw non-JSON string in get() without breaking Redis availability", async () => {
      mockRedis.get.mockResolvedValue("plain-unquoted-token");

      const result = await service.get<string>("token:key");
      expect(result).toBe("plain-unquoted-token");
      expect(service.isAvailable()).toBe(true);
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
        eval: jest.fn(),
        mget: jest.fn(),
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

    it("should fallback to in-memory lock if redis eval throws in acquireLock", async () => {
      mockRedis.eval.mockRejectedValue(new Error("Connection lost"));

      const acquired = await service.acquireLock("lock:s1", "u1", 300);
      expect(acquired).toBe(true);
      expect(service.isAvailable()).toBe(false);
      expect(await service.getLock("lock:s1")).toBe("u1");
    });

    it("should fallback to in-memory getLock if redis get throws", async () => {
      (service as any).setToMemory("lock:s2", "u2", 300);
      mockRedis.get.mockRejectedValue(new Error("Timeout"));

      const owner = await service.getLock("lock:s2");
      expect(owner).toBe("u2");
      expect(service.isAvailable()).toBe(false);
    });

    it("should fallback to in-memory mget if redis mget throws", async () => {
      (service as any).setToMemory("lock:s3", "u3", 300);
      mockRedis.mget.mockRejectedValue(new Error("Timeout"));

      const res = await service.mget(["lock:s3"]);
      expect(res).toEqual(["u3"]);
      expect(service.isAvailable()).toBe(false);
    });

    it("should fallback to in-memory getKeysByPattern if redis scan throws", async () => {
      (service as any).setToMemory("lock:showtime:s4", "u4", 300);
      mockRedis.scan.mockRejectedValue(new Error("Timeout"));

      const keys = await service.getKeysByPattern("lock:showtime:*");
      expect(keys).toEqual(["lock:showtime:s4"]);
      expect(service.isAvailable()).toBe(false);
    });
  });
});
