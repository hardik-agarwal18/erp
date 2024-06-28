import request from "supertest";

import app from "../../../src/app.js";
import { createTestUser } from "../../helpers/auth.helper.js";
import { createOrganization } from "../../helpers/organization.helper.js";
import { decodeAccessToken } from "../../helpers/token.helper.js";

describe("auth login", () => {
  it("returns workspace-aware auth payload with cookies", async () => {
    const user = await createTestUser({
      email: "login.user@example.com",
    });
    const organization = await createOrganization(user.id, {
      name: "Login Workspace",
    });

    const response = await request(app).post("/api/v1/auth/login").send({
      email: user.email,
      password: "Password123!",
    });

    expect(response.status).toBe(200);
    expect(response.headers["set-cookie"]).toBeDefined();
    expect(response.body.data.organizations).toHaveLength(1);
    expect(response.body.data.activeOrganization.id).toBe(organization.id);

    const payload = decodeAccessToken(response.body.data.accessToken);
    expect(payload.sub).toBe(user.id);
    expect(payload.organizationId).toBe(organization.id);
    expect(payload.role).toBe("owner");
  });

  it("rejects login for unverified users", async () => {
    const user = await createTestUser({
      email: "unverified.user@example.com",
      isVerified: false,
    });

    const response = await request(app).post("/api/v1/auth/login").send({
      email: user.email,
      password: "Password123!",
    });

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/not verified/i);
  });
});
