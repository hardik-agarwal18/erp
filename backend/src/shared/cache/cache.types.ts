// @ts-nocheck
export interface CacheOptions {
  /** Time to live in seconds */
  ttl?: number;
  /** Namespace or Domain for the cache key (e.g., 'inventory', 'products') */
  domain: string;
  /** Organization ID (for multi-tenant support) */
  organizationId: string;
  /** Resource name (e.g., 'list', 'summary') */
  resource: string;
  /** Identifier (e.g., product ID, query hash) - optional */
  identifier?: string;
}

export interface SetCacheOptions extends CacheOptions {
  /** Data to cache */
  data: any;
}

export interface GetOrSetCacheOptions<T> extends CacheOptions {
  /** Function to fetch data if cache miss occurs */
  fetcher: () => Promise<T>;
  /** Optional stale-while-revalidate setting */
  swr?: boolean;
}

export interface InvalidationOptions {
  /** Organization ID */
  organizationId: string;
  /** Namespace or Domain */
  domain: string;
  /** Resource name */
  resource?: string;
  /** Exact identifier to invalidate, or use pattern if not provided */
  identifier?: string;
}
