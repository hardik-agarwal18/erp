// @ts-nocheck
import { redisClient } from "../../config/redis.js";
import logger from "../../config/logger.js";
import {
  cacheHitsTotal,
  cacheMissesTotal,
  cacheSetTotal,
  cacheDeleteTotal,
} from "../../monitoring/metrics.js";
import { CACHE_CONSTANTS } from "./cache.constants.js";
import {
  CacheOptions,
  GetOrSetCacheOptions,
  InvalidationOptions,
  SetCacheOptions,
} from "./cache.types.js";

export class CacheService {
  private static coalescingPromises = new Map<string, Promise<any>>();

  /**
   * Generates a standardized cache key
   */
  public static generateKey(options: CacheOptions): string {
    const parts = [
      `org:${options.organizationId}`,
      options.domain,
      options.resource,
    ];

    if (options.identifier) {
      parts.push(options.identifier);
    }

    return parts.join(":");
  }

  /**
   * Retrieve an item from the cache
   */
  public static async get<T>(options: CacheOptions): Promise<T | null> {
    if (!CACHE_CONSTANTS.ENABLED) return null;

    const key = this.generateKey(options);

    try {
      const data = await redisClient.get(key);

      if (data) {
        cacheHitsTotal.labels(options.domain).inc();
        return JSON.parse(data) as T;
      } else {
        cacheMissesTotal.labels(options.domain).inc();
        return null;
      }
    } catch (error) {
      logger.error({ error, key }, "Cache GET error");
      return null; // Fail open
    }
  }

  /**
   * Store an item in the cache
   */
  public static async set(options: SetCacheOptions): Promise<void> {
    if (!CACHE_CONSTANTS.ENABLED) return;

    const key = this.generateKey(options);
    const ttl = options.ttl ?? CACHE_CONSTANTS.DEFAULT_TTL;

    try {
      await redisClient.set(key, JSON.stringify(options.data), {
        EX: ttl,
      });

      cacheSetTotal.labels(options.domain).inc();
    } catch (error) {
      logger.error({ error, key }, "Cache SET error");
      // Fail open (don't throw)
    }
  }

  /**
   * Get an item from cache, or execute the fetcher and cache the result
   */
  public static async getOrSet<T>(options: GetOrSetCacheOptions<T>): Promise<T> {
    if (!CACHE_CONSTANTS.ENABLED) {
      return options.fetcher();
    }

    const key = this.generateKey(options);

    // 1. Check cache first
    const cachedData = await this.get<T>(options);
    if (cachedData !== null) {
      return cachedData;
    }

    // 2. Request coalescing protection (Cache Stampede protection)
    if (this.coalescingPromises.has(key)) {
      return this.coalescingPromises.get(key)!;
    }

    // 3. Fetch from source
    const promise = options
      .fetcher()
      .then(async (data) => {
        // Only cache if data is valid (not null/undefined)
        // Or you might want to cache nulls to prevent continuous misses on non-existent data?
        // For now, we cache everything returned.
        if (data !== undefined) {
          await this.set({
            ...options,
            data,
          });
        }
        return data;
      })
      .finally(() => {
        // Clean up the promise map
        this.coalescingPromises.delete(key);
      });

    this.coalescingPromises.set(key, promise);

    return promise;
  }

  /**
   * Delete an exact key
   */
  public static async delete(options: CacheOptions): Promise<void> {
    if (!CACHE_CONSTANTS.ENABLED) return;

    const key = this.generateKey(options);

    try {
      await redisClient.del(key);
      cacheDeleteTotal.labels(options.domain).inc();
    } catch (error) {
      logger.error({ error, key }, "Cache DELETE error");
    }
  }

  /**
   * Delete keys matching a pattern (e.g. invalidate all lists for a domain)
   * Example: org:123:products:*
   */
  public static async deletePattern(options: InvalidationOptions): Promise<void> {
    if (!CACHE_CONSTANTS.ENABLED) return;

    const parts = [
      `org:${options.organizationId}`,
      options.domain,
    ];

    if (options.resource) {
      parts.push(options.resource);
    }
    if (options.identifier) {
      parts.push(options.identifier);
    } else {
      parts.push("*");
    }

    const pattern = parts.join(":");

    try {
      // NOTE: KEYS command can be slow on large datasets, 
      // SCAN is preferred in production, but for targeted prefix matching it's usually acceptable if limited.
      // We will use SCAN for better performance in production.
      let cursor = 0;
      do {
        // @ts-ignore - node-redis scan syntax
        const result = await redisClient.scan(cursor, {
          MATCH: pattern,
          COUNT: 100,
        });
        
        cursor = result.cursor;
        const keys = result.keys;

        if (keys.length > 0) {
          await redisClient.del(keys);
          cacheDeleteTotal.labels(options.domain).inc(keys.length);
        }
      } while (cursor !== 0);

    } catch (error) {
      logger.error({ error, pattern }, "Cache DELETE PATTERN error");
    }
  }
}
