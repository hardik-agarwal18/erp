// @ts-nocheck
import { Request, Response, NextFunction } from "express";
import { redisClient } from "../config/redis.js";

export const idempotencyMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const key = req.headers["x-idempotency-key"] as string;
  if (!req.method.match(/^(POST|PATCH|PUT)$/) || !key) return next();

  // Support req.organization from tenant middleware or user org
  const orgId = (req as any).organization?.id || (req as any).user?.organizationId || "global";
  const cacheKey = `idempotency:${orgId}:${key}`;
  
  try {
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      const { status, body } = JSON.parse(cached);
      return res.status(status).json(body);
    }

    // Intercept and cache the response
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      if (res.statusCode < 400) {
        redisClient.setEx(cacheKey, 86400, JSON.stringify({ status: res.statusCode, body }));
      }
      return originalJson(body);
    };

    return next();
  } catch (error) {
    // If Redis fails, proceed without idempotency to avoid blocking the request completely
    return next();
  }
};