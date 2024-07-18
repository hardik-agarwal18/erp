import express from "express";
import request from "supertest";

import { createApiRateLimiter } from "../../../src/middleware/rateLimit.middleware.js";

describe("rate limit middleware", () => {
  it("returns 429 after the configured request limit is exceeded", async () => {
    const testApp = express();
    testApp.use(createApiRateLimiter({ max: 2, windowMs: 60_000 }));
    testApp.get("/probe", (_req, res) => {
      res.json({ success: true });
    });

    await request(testApp).get("/probe");
    await request(testApp).get("/probe");
    const response = await request(testApp).get("/probe");

    expect(response.status).toBe(429);
    expect(response.body.message).toMatch(/too many requests/i);
  });
});
