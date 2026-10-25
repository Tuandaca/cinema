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

  constructor() {
    this.initClient();
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
        retryStrategy: (times) => {
          if (times > 3) {
            return null;
          }
          return Math.min(times * 500, 2000);
        },
      });

      this.redis.on("error", (err) => {
        this.logger.warn(`Redis Client Error: ${err.message}`);
        this.redisAvailable = false;
      });

      this.redis.on("connect", () => {
        this.redisAvailable = true;
        this.logger.log("Redis connected successfully");
      });

      this.redis.on("ready", () => {
        this.redisAvailable = true;
      });

      this.redis.on("close", () => {
        this.redisAvailable = false;
        this.logger.warn("Redis connection closed; using in-memory cache");
      });

      this.redis.on("end", () => {
        this.redisAvailable = false;
      });
    } catch (err: any) {
      this.logger.warn(
        `Failed to initialize Redis client: ${err.message}. Operating in memory cache fallback mode.`,
      );
      this.redis = null;
      this.redisAvailable = false;
    }
  }

  async onModuleInit(): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.connect();
        this.redisAvailable = true;
      } catch (err: any) {
        this.logger.warn(
          `Redis connection failed during init: ${err.message}. Operating in memory cache fallback mode.`,
        );
        this.redisAvailable = false;
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
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

  async get<T>(key: string): Promise<T | null> {
    if (this.redisAvailable && this.redis) {
      try {
        const raw = await this.redis.get(key);
        if (raw === null || raw === undefined) {
          return null;
        }
        return JSON.parse(raw) as T;
      } catch (err: any) {
        this.logger.warn(
          `Redis get error for key "${key}": ${err.message}. Falling back to in-memory cache.`,
        );
        this.redisAvailable = false;
        return this.getFromMemory<T>(key);
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
        this.logger.warn(
          `Redis set error for key "${key}": ${err.message}. Storing in in-memory fallback.`,
        );
        this.redisAvailable = false;
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
        this.logger.warn(`Redis del error for key "${key}": ${err.message}`);
        this.redisAvailable = false;
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
        this.logger.warn(
          `Redis delPattern error for pattern "${pattern}": ${err.message}`,
        );
        this.redisAvailable = false;
      }
    }
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

  private setToMemory(key: string, value: any, ttlSeconds?: number): void {
    const expiresAt =
      ttlSeconds && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : undefined;
    this.memoryCache.set(key, { value, expiresAt });
  }

  private delFromMemory(key: string): void {
    this.memoryCache.delete(key);
  }

  private delPatternFromMemory(pattern: string): void {
    const regexPattern = new RegExp(
      "^" +
        pattern
          .replace(/[-[\]{}()+?.,\\^$|#\s]/g, "\\$&")
          .replace(/\*/g, ".*") +
        "$",
    );
    for (const key of this.memoryCache.keys()) {
      if (regexPattern.test(key)) {
        this.memoryCache.delete(key);
      }
    }
  }
}
