import request from "supertest";

import app from "../../../src/app.js";
import {
  createTestUser,
  listRedisRefreshSessions,
  loginTestUser,
} from "../../helpers/auth.helper.js";
import { createOrganization } from "../../helpers/organization.helper.js";
import {
  decodeRefreshToken,
  extractAuthCookies,
} from "../../helpers/token.helper.js";
import { prisma } from "../../setup/testDb.js";

describe("auth refresh", () => {
  it("rotates the refresh token and revokes the previous session", async () => {
    const user = await createTestUser({ email: "refresh.user@example.com" });
    await createOrganization(user.id, { name: "Refresh Org" });

    const login = await loginTestUser(app, { email: user.email });
    const oldRefreshToken = login.refreshToken!;
    const oldRefreshPayload = decodeRefreshToken(oldRefreshToken);

    const response = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", login.cookieHeader)
      .set("x-csrf-token", login.csrfToken!)
      .send({});

    const newCookies = extractAuthCookies(response);
    const sessions = await prisma.refreshSession.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });

    expect(response.status).toBe(200);
    expect(newCookies.refreshToken).toBeDefined();
    expect(newCookies.refreshToken).not.toBe(oldRefreshToken);
    expect(sessions).toHaveLength(2);
    expect(sessions.find((session) => session.id === oldRefreshPayload.jti)?.revokedAt)
      .not.toBeNull();
    expect(await listRedisRefreshSessions()).toHaveLength(1);
  });

  it("rejects refresh with an invalid csrf token", async () => {
    const user = await createTestUser({ email: "csrf.user@example.com" });
    await createOrganization(user.id, { name: "CSRF Org" });
    const login = await loginTestUser(app, { email: user.email });

    const response = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", login.cookieHeader)
      .set("x-csrf-token", "invalid-csrf-token")
      .send({});

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/csrf/i);
  });
});
