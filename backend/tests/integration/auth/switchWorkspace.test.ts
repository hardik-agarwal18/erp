import request from "supertest";

import app from "../../../src/app.js";
import { createTestUser, loginTestUser } from "../../helpers/auth.helper.js";
import { createOrganization } from "../../helpers/organization.helper.js";
import { decodeRefreshToken, decodeAccessToken } from "../../helpers/token.helper.js";
import { prisma } from "../../setup/testDb.js";

describe("workspace switching", () => {
  it("updates the active workspace and issues a new tenant-scoped access token", async () => {
    const user = await createTestUser({ email: "workspace.user@example.com" });
    const organizationA = await createOrganization(user.id, { name: "Org A" });
    const organizationB = await createOrganization(user.id, { name: "Org B" });

    const login = await loginTestUser(app, { email: user.email });
    expect(login.response.body.data.activeOrganization.id).toBe(organizationA.id);

    const response = await request(app)
      .post("/api/v1/auth/switch-workspace")
      .set("Authorization", `Bearer ${login.accessToken}`)
      .set("Cookie", login.cookieHeader)
      .set("x-csrf-token", login.csrfToken!)
      .send({ organizationId: organizationB.id });

    const refreshPayload = decodeRefreshToken(login.refreshToken!);
    const session = await prisma.refreshSession.findUniqueOrThrow({
      where: { id: refreshPayload.jti },
    });
    const payload = decodeAccessToken(response.body.data.accessToken);

    expect(response.status).toBe(200);
    expect(response.body.data.activeOrganization.id).toBe(organizationB.id);
    expect(payload.organizationId).toBe(organizationB.id);
    expect(session.activeOrganizationId).toBe(organizationB.id);
  });
});
