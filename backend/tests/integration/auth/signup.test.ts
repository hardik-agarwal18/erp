import request from "supertest";

import app from "../../../src/app.js";
import { prisma } from "../../setup/testDb.js";

describe("auth signup", () => {
  it("creates an unverified user and stores an email verification token", async () => {
    const response = await request(app).post("/api/v1/auth/signup").send({
      name: "Signup User",
      email: "signup.user@example.com",
      password: "Password123!",
    });

    expect(response.status).toBe(201);
    expect(response.body.message).toMatch(/registration successful/i);

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: "signup.user@example.com" },
    });
    const tokens = await prisma.emailVerificationToken.findMany({
      where: { userId: user.id },
    });

    expect(user.isVerified).toBe(false);
    expect(tokens).toHaveLength(1);
  });

  it("returns a validation error for malformed input", async () => {
    const response = await request(app).post("/api/v1/auth/signup").send({
      name: "A",
      email: "not-an-email",
      password: "short",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/validation error/i);
  });
});
