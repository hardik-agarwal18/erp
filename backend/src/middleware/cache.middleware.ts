
import { Request, Response, NextFunction } from "express";
import { CacheService } from "../shared/cache/index.js";
import { CACHE_CONSTANTS } from "../shared/cache/index.js";
import logger from "../config/logger.js";

interface CacheMiddlewareOptions {
  ttl?: number;
  domain: string;
  resource?: string;
}

export const cacheMiddleware = (options: CacheMiddlewareOptions) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!CACHE_CONSTANTS.ENABLED) {
      return next();
    }

    // Attempt to extract organizationId (usually attached by auth/tenant middleware)
    // @ts-ignore - Assuming req.tenant or req.user contains the org ID
    const organizationId = req.tenant?.id || req.user?.organizationId;

    if (!organizationId) {
      logger.warn("cacheMiddleware bypassed: No organizationId found on request");
      return next();
    }

    const resource = options.resource || req.path.replace(/^\/|\/$/g, "").replace(/\//g, "-") || "root";
    
    // Create a deterministic identifier from the query string and maybe params
    const queryStr = Object.keys(req.query).length 
        ? JSON.stringify(req.query) 
        : "";
    const paramsStr = Object.keys(req.params).length 
        ? JSON.stringify(req.params) 
        : "";
    
    // Basic hash of query and params for the cache identifier
    let identifier = "";
    if (queryStr || paramsStr) {
        identifier = Buffer.from(`${queryStr}-${paramsStr}`).toString("base64");
    }

    const cacheOptions = {
      organizationId,
      domain: options.domain,
      resource,
      ...(identifier ? { identifier } : {}),
    };

    try {
      // Try to get from cache
      const cachedData = await CacheService.get(cacheOptions);

      if (cachedData) {
        res.json(cachedData);
        return;
      }

      // Cache miss, hijack res.json
      const originalJson = res.json.bind(res);
      
      res.json = ((body: any) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          CacheService.set({
            ...cacheOptions,
            ttl: options.ttl,
            data: body,
          }).catch((err) => {
             logger.error({ err }, "Error setting cache in middleware");
          });
        }
        
        return originalJson(body);
      }) as any;

      next();
    } catch (error) {
      logger.error({ error }, "Cache middleware error");
      next(); // Fail open
    }
  };
};
