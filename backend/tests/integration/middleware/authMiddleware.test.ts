import express from "express";
import request from "supertest";

import { authMiddleware } from "../../../src/middleware/auth.middleware.js";
import { errorMiddleware } from "../../../src/middleware/error.middleware.js";
import { createTestUser } from "../../helpers/auth.helper.js";
import { generateAccessTokenForTest } from "../../helpers/token.helper.js";

describe("auth middleware", () => {
  const middlewareApp = () => {
    const testApp = express();
    testApp.get("/probe", authMiddleware, (req, res) => {
      res.json({ success: true, data: req.user });
    });
    testApp.use(errorMiddleware);
    return testApp;
  };

  it("injects authenticated user context for valid access tokens", async () => {
    const user = await createTestUser({ email: "auth.middleware@example.com" });
    const token = generateAccessTokenForTest(user.id);

    const response = await request(middlewareApp())
      .get("/probe")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(user.id);
  });

  it("rejects invalid tokens", async () => {
    const response = await request(middlewareApp())
      .get("/probe")
      .set("Authorization", "Bearer invalid-token");

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/unauthorized/i);
  });
});
