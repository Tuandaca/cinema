import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import Redis from "ioredis";

interface CacheEntry {
  value: any;
  expiresAt?: number;
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redis: Redis | null = null;
  private redisAvailable = false;
  private readonly memoryCache = new Map<string, CacheEntry>();
  private loggedFallbackNotice = false;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.initClient();
    this.startCleanupTimer();
  }

  private startCleanupTimer(): void {
    if (this.cleanupTimer) return;
    this.cleanupTimer = setInterval(() => {
      this.evictExpiredKeys();
    }, 30000);
    if (this.cleanupTimer && typeof this.cleanupTimer.unref === "function") {
      this.cleanupTimer.unref();
    }
  }

  /**
   * Actively evicts expired keys from in-memory cache.
   * Returns the count of evicted keys.
   */
  evictExpiredKeys(): number {
    const now = Date.now();
    let evicted = 0;
    for (const [key, item] of this.memoryCache.entries()) {
      if (item.expiresAt !== undefined && now > item.expiresAt) {
        this.memoryCache.delete(key);
        evicted++;
      }
    }
    return evicted;
  }

  private initClient(): void {
    const redisUrl =
      process.env.REDIS_URL ||
      process.env.UPSTASH_REDIS_URL ||
      "redis://localhost:6379";

    try {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        lazyConnect: true,
        enableOfflineQueue: false,
        retryStrategy: (times) => {
          if (times >= 2) {
            this.handleUnreachable("Max retry attempts reached");
            return null; // Stop retrying
          }
          return Math.min(times * 500, 1000);
        },
      });

      this.redis.on("error", (err: any) => {
        const isDnsError =
          err?.message?.includes("ENOTFOUND") ||
          err?.code === "ENOTFOUND" ||
          err?.syscall === "getaddrinfo";

        if (isDnsError) {
          this.handleUnreachable(`DNS lookup failed: ${err.message}`);
        } else if (!this.redisAvailable) {
          this.handleUnreachable(err.message);
        } else {
          this.redisAvailable = false;
          this.notifyFallback();
        }
      });

      this.redis.on("connect", () => {
        this.redisAvailable = true;
        this.loggedFallbackNotice = false;
        this.logger.log("Redis connected successfully");
      });

      this.redis.on("ready", () => {
        this.redisAvailable = true;
      });

      this.redis.on("close", () => {
        if (this.redisAvailable) {
          this.redisAvailable = false;
          this.notifyFallback();
        }
      });

      this.redis.on("end", () => {
        this.redisAvailable = false;
      });
    } catch (err: any) {
      this.handleUnreachable(err.message);
      this.redis = null;
    }
  }

  private handleUnreachable(reason?: string): void {
    this.redisAvailable = false;
    if (this.redis && typeof this.redis.disconnect === "function") {
      try {
        this.redis.disconnect();
      } catch {
        // ignore disconnect errors
      }
    }
    this.notifyFallback();
  }

  private notifyFallback(): void {
    if (!this.loggedFallbackNotice) {
      this.loggedFallbackNotice = true;
      this.logger.log(
        "[Redis] Remote Redis unreachable. High-performance in-memory engine active.",
      );
    }
  }

  private handleRedisError(context: string, err: any): void {
    this.redisAvailable = false;
    const isDnsError =
      err?.message?.includes("ENOTFOUND") ||
      err?.code === "ENOTFOUND" ||
      err?.syscall === "getaddrinfo";

    if (isDnsError) {
      this.handleUnreachable(`DNS error in ${context}: ${err.message}`);
    } else {
      this.handleUnreachable(`Connection error in ${context}: ${err.message}`);
    }
  }

  async onModuleInit(): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.connect();
        this.redisAvailable = true;
      } catch (err: any) {
        this.handleUnreachable(err.message);
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    if (this.redis && typeof this.redis.disconnect === "function") {
      try {
        this.redis.disconnect();
      } catch {
        // ignore disconnect errors during shutdown
      }
    }
    this.memoryCache.clear();
  }

  isAvailable(): boolean {
    return this.redisAvailable;
  }

  // ==========================================
  // GENERAL CACHE API (Key-Value)
  // ==========================================

  async get<T>(key: string): Promise<T | null> {
    if (this.redisAvailable && this.redis) {
      let raw: string | null = null;
      try {
        raw = await this.redis.get(key);
      } catch (err: any) {
        this.handleRedisError("get", err);
        return this.getFromMemory<T>(key);
      }

      if (raw === null || raw === undefined) {
        return null;
      }

      try {
        return JSON.parse(raw) as T;
      } catch {
        return raw as unknown as T;
      }
    }
    return this.getFromMemory<T>(key);
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (this.redisAvailable && this.redis) {
      try {
        const serialized = JSON.stringify(value);
        if (ttlSeconds && ttlSeconds > 0) {
          await this.redis.set(key, serialized, "EX", ttlSeconds);
        } else {
          await this.redis.set(key, serialized);
        }
        return;
      } catch (err: any) {
        this.handleRedisError("set", err);
        this.setToMemory(key, value, ttlSeconds);
        return;
      }
    }
    this.setToMemory(key, value, ttlSeconds);
  }

  async del(key: string): Promise<void> {
    this.delFromMemory(key);
    if (this.redisAvailable && this.redis) {
      try {
        await this.redis.del(key);
      } catch (err: any) {
        this.handleRedisError("del", err);
      }
    }
  }

  async delPattern(pattern: string): Promise<void> {
    this.delPatternFromMemory(pattern);
    if (this.redisAvailable && this.redis) {
      try {
        let cursor = "0";
        do {
          const [nextCursor, keys] = await this.redis.scan(
            cursor,
            "MATCH",
            pattern,
            "COUNT",
            100,
          );
          cursor = nextCursor;
          if (keys && keys.length > 0) {
            await this.redis.del(...keys);
          }
        } while (cursor !== "0");
      } catch (err: any) {
        this.handleRedisError("delPattern", err);
      }
    }
  }

  // ==========================================
  // ATOMIC SEAT LOCKING & QUERY API
  // ==========================================

  /**
   * Atomically acquires a lock on `key` with owner `value` and TTL in seconds.
   * Succeeds if key doesn't exist or is already held by `value`.
   */
  async acquireLock(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    if (this.redisAvailable && this.redis) {
      try {
        const script = `
          local current = redis.call("GET", KEYS[1])
          if not current or current == ARGV[1] then
            redis.call("SET", KEYS[1], ARGV[1], "EX", tonumber(ARGV[2]))
            return 1
          else
            return 0
          end
        `;
        const result = await this.redis.eval(
          script,
          1,
          key,
          value,
          ttlSeconds,
        );
        return result === 1;
      } catch (err: any) {
        this.handleRedisError("acquireLock", err);
        return this.acquireLockInMemory(key, value, ttlSeconds);
      }
    }
    return this.acquireLockInMemory(key, value, ttlSeconds);
  }

  /**
   * Atomically acquires multiple locks. Succeeds only if ALL keys can be acquired.
   */
  async acquireLocks(
    keys: string[],
    value: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    if (keys.length === 0) return true;
    if (keys.length === 1) {
      return this.acquireLock(keys[0], value, ttlSeconds);
    }

    if (this.redisAvailable && this.redis) {
      try {
        const script = `
          local keys = KEYS
          local userId = ARGV[1]
          local ttl = tonumber(ARGV[2])

          for i, key in ipairs(keys) do
            if redis.call("EXISTS", key) == 1 then
              local currentOwner = redis.call("GET", key)
              if currentOwner ~= userId then
                return 0
              end
            end
          end

          for i, key in ipairs(keys) do
            redis.call("SET", key, userId, "EX", ttl)
          end

          return 1
        `;
        const result = await this.redis.eval(
          script,
          keys.length,
          ...keys,
          value,
          ttlSeconds,
        );
        return result === 1;
      } catch (err: any) {
        this.handleRedisError("acquireLocks", err);
        return this.acquireLocksInMemory(keys, value, ttlSeconds);
      }
    }
    return this.acquireLocksInMemory(keys, value, ttlSeconds);
  }

  /**
   * Atomically acquires seat locks for a given showtime and seats.
   * Checks that neither hard lock (lock:showtime:seat) nor soft lock (softlock:showtime:seat)
   * is held by another user. If acquired, sets the hard locks and clears any soft lock held by this user.
   */
  async acquireSeatLocks(
    showtimeId: string,
    seatIds: string[],
    userId: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    if (seatIds.length === 0) return true;

    if (this.redisAvailable && this.redis) {
      try {
        const hardKeys = seatIds.map((id) => `lock:${showtimeId}:${id}`);
        const softKeys = seatIds.map((id) => `softlock:${showtimeId}:${id}`);
        const allKeys = [...hardKeys, ...softKeys];

        const script = `
          local seatCount = tonumber(ARGV[1])
          local userId = ARGV[2]
          local ttl = tonumber(ARGV[3])

          for i = 1, seatCount do
            local hardKey = KEYS[i]
            local softKey = KEYS[seatCount + i]

            local hardOwner = redis.call("GET", hardKey)
            if hardOwner and hardOwner ~= userId then
              return 0
            end

            local softOwner = redis.call("GET", softKey)
            if softOwner and softOwner ~= userId then
              return 0
            end
          end

          for i = 1, seatCount do
            local hardKey = KEYS[i]
            local softKey = KEYS[seatCount + i]

            redis.call("SET", hardKey, userId, "EX", ttl)
            local softOwner = redis.call("GET", softKey)
            if softOwner == userId then
              redis.call("DEL", softKey)
            end
          end

          return 1
        `;

        const result = await this.redis.eval(
          script,
          allKeys.length,
          ...allKeys,
          seatIds.length,
          userId,
          ttlSeconds,
        );
        return result === 1;
      } catch (err: any) {
        this.handleRedisError("acquireSeatLocks", err);
        return this.acquireSeatLocksInMemory(
          showtimeId,
          seatIds,
          userId,
          ttlSeconds,
        );
      }
    }
    return this.acquireSeatLocksInMemory(
      showtimeId,
      seatIds,
      userId,
      ttlSeconds,
    );
  }

  /**
   * Releases lock on `key` if and only if currently held by `value`.
   */
  async releaseLock(key: string, value: string): Promise<boolean> {
    if (this.redisAvailable && this.redis) {
      try {
        const script = `
          local current = redis.call("GET", KEYS[1])
          if current == ARGV[1] then
            return redis.call("DEL", KEYS[1])
          else
            return 0
          end
        `;
        const result = await this.redis.eval(script, 1, key, value);
        return result === 1;
      } catch (err: any) {
        this.handleRedisError("releaseLock", err);
        return this.releaseLockInMemory(key, value);
      }
    }
    return this.releaseLockInMemory(key, value);
  }

  /**
   * Releases multiple locks if held by `value`.
   */
  async releaseLocks(keys: string[], value: string): Promise<void> {
    if (keys.length === 0) return;
    if (this.redisAvailable && this.redis) {
      try {
        const script = `
          local keys = KEYS
          local userId = ARGV[1]
          for i, key in ipairs(keys) do
            local currentOwner = redis.call("GET", key)
            if currentOwner == userId then
              redis.call("DEL", key)
            end
          end
          return 1
        `;
        await this.redis.eval(script, keys.length, ...keys, value);
        return;
      } catch (err: any) {
        this.handleRedisError("releaseLocks", err);
      }
    }
    for (const key of keys) {
      this.releaseLockInMemory(key, value);
    }
  }

  /**
   * Soft-locks a seat: checks that neither hardKey nor softKey is locked by someone else.
   */
  async acquireSoftLock(
    softKey: string,
    hardKey: string,
    value: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    if (this.redisAvailable && this.redis) {
      try {
        const script = `
          local softKey = KEYS[1]
          local hardKey = KEYS[2]
          local userId = ARGV[1]
          local ttl = tonumber(ARGV[2])

          local hardOwner = redis.call("GET", hardKey)
          if hardOwner and hardOwner ~= userId then
            return 0
          end

          local softOwner = redis.call("GET", softKey)
          if softOwner and softOwner ~= userId then
            return 0
          end

          redis.call("SET", softKey, userId, "EX", ttl)
          return 1
        `;
        const result = await this.redis.eval(
          script,
          2,
          softKey,
          hardKey,
          value,
          ttlSeconds,
        );
        return result === 1;
      } catch (err: any) {
        this.handleRedisError("acquireSoftLock", err);
        return this.acquireSoftLockInMemory(softKey, hardKey, value, ttlSeconds);
      }
    }
    return this.acquireSoftLockInMemory(softKey, hardKey, value, ttlSeconds);
  }

  /**
   * Retrieves current raw string value (lock owner) of `key`.
   */
  async getLock(key: string): Promise<string | null> {
    if (this.redisAvailable && this.redis) {
      try {
        const raw = await this.redis.get(key);
        return raw ?? null;
      } catch (err: any) {
        this.handleRedisError("getLock", err);
        return this.getLockFromMemory(key);
      }
    }
    return this.getLockFromMemory(key);
  }

  /**
   * Retrieves raw string values of multiple keys.
   */
  async mget(keys: string[]): Promise<(string | null)[]> {
    if (keys.length === 0) return [];
    if (this.redisAvailable && this.redis) {
      try {
        const values = await this.redis.mget(...keys);
        return values.map((v) => (v === undefined ? null : v));
      } catch (err: any) {
        this.handleRedisError("mget", err);
        return this.mgetFromMemory(keys);
      }
    }
    return this.mgetFromMemory(keys);
  }

  /**
   * Retrieves all active keys matching the specified pattern.
   */
  async getKeysByPattern(pattern: string): Promise<string[]> {
    if (this.redisAvailable && this.redis) {
      try {
        let cursor = "0";
        const matchedKeys: string[] = [];
        do {
          const [nextCursor, keys] = await this.redis.scan(
            cursor,
            "MATCH",
            pattern,
            "COUNT",
            100,
          );
          cursor = nextCursor;
          if (keys && keys.length > 0) {
            matchedKeys.push(...keys);
          }
        } while (cursor !== "0");
        return Array.from(new Set(matchedKeys));
      } catch (err: any) {
        this.handleRedisError("getKeysByPattern", err);
        return this.getKeysByPatternFromMemory(pattern);
      }
    }
    return this.getKeysByPatternFromMemory(pattern);
  }

  // ==========================================
  // IN-MEMORY RESILIENT FALLBACK METHODS
  // ==========================================

  private getFromMemory<T>(key: string): T | null {
    const item = this.memoryCache.get(key);
    if (!item) {
      return null;
    }
    if (item.expiresAt !== undefined && Date.now() > item.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }
    return item.value as T;
  }

  private getLockFromMemory(key: string): string | null {
    const item = this.memoryCache.get(key);
    if (!item) {
      return null;
    }
    if (item.expiresAt !== undefined && Date.now() > item.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }
    return item.value !== null && item.value !== undefined ? String(item.value) : null;
  }

  private setToMemory(key: string, value: any, ttlSeconds?: number): void {
    const expiresAt =
      ttlSeconds && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : undefined;
    this.memoryCache.set(key, { value, expiresAt });
  }

  private delFromMemory(key: string): void {
    this.memoryCache.delete(key);
  }

  private globToRegex(pattern: string): RegExp {
    const escaped = pattern.replace(/[-[\]{}()+.,\\^$|#\s]/g, "\\$&");
    const regexStr = escaped.replace(/\*/g, ".*").replace(/\?/g, ".");
    return new RegExp(`^${regexStr}$`);
  }

  private delPatternFromMemory(pattern: string): void {
    const regexPattern = this.globToRegex(pattern);
    for (const key of this.memoryCache.keys()) {
      if (regexPattern.test(key)) {
        this.memoryCache.delete(key);
      }
    }
  }

  private acquireLockInMemory(
    key: string,
    value: string,
    ttlSeconds: number,
  ): boolean {
    const current = this.getLockFromMemory(key);
    if (current === null || current === value) {
      this.setToMemory(key, value, ttlSeconds);
      return true;
    }
    return false;
  }

  private acquireLocksInMemory(
    keys: string[],
    value: string,
    ttlSeconds: number,
  ): boolean {
    for (const key of keys) {
      const current = this.getLockFromMemory(key);
      if (current !== null && current !== value) {
        return false;
      }
    }
    for (const key of keys) {
      this.setToMemory(key, value, ttlSeconds);
    }
    return true;
  }

  private acquireSeatLocksInMemory(
    showtimeId: string,
    seatIds: string[],
    userId: string,
    ttlSeconds: number,
  ): boolean {
    for (const seatId of seatIds) {
      const hardKey = `lock:${showtimeId}:${seatId}`;
      const softKey = `softlock:${showtimeId}:${seatId}`;

      const hardOwner = this.getLockFromMemory(hardKey);
      if (hardOwner !== null && hardOwner !== userId) {
        return false;
      }

      const softOwner = this.getLockFromMemory(softKey);
      if (softOwner !== null && softOwner !== userId) {
        return false;
      }
    }

    for (const seatId of seatIds) {
      const hardKey = `lock:${showtimeId}:${seatId}`;
      const softKey = `softlock:${showtimeId}:${seatId}`;

      this.setToMemory(hardKey, userId, ttlSeconds);
      if (this.getLockFromMemory(softKey) === userId) {
        this.delFromMemory(softKey);
      }
    }

    return true;
  }

  private releaseLockInMemory(key: string, value: string): boolean {
    const current = this.getLockFromMemory(key);
    if (current === value) {
      this.delFromMemory(key);
      return true;
    }
    return false;
  }

  private acquireSoftLockInMemory(
    softKey: string,
    hardKey: string,
    value: string,
    ttlSeconds: number,
  ): boolean {
    const hardOwner = this.getLockFromMemory(hardKey);
    if (hardOwner !== null && hardOwner !== value) {
      return false;
    }
    const softOwner = this.getLockFromMemory(softKey);
    if (softOwner !== null && softOwner !== value) {
      return false;
    }
    this.setToMemory(softKey, value, ttlSeconds);
    return true;
  }

  private mgetFromMemory(keys: string[]): (string | null)[] {
    return keys.map((key) => this.getLockFromMemory(key));
  }

  private getKeysByPatternFromMemory(pattern: string): string[] {
    const regexPattern = this.globToRegex(pattern);
    const matched: string[] = [];
    const now = Date.now();
    for (const [key, item] of this.memoryCache.entries()) {
      if (regexPattern.test(key)) {
        if (item.expiresAt !== undefined && now > item.expiresAt) {
          this.memoryCache.delete(key);
        } else {
          matched.push(key);
        }
      }
    }
    return matched;
  }
}
