import request from "supertest";

import app from "../../../src/app.js";
import { createTestUser, loginTestUser } from "../../helpers/auth.helper.js";
import { createOrganization } from "../../helpers/organization.helper.js";

describe("workspace isolation", () => {
  it("blocks access to members from another organization", async () => {
    const userA = await createTestUser({ email: "orga.owner@example.com" });
    const userB = await createTestUser({ email: "orgb.owner@example.com" });
    const organizationA = await createOrganization(userA.id, {
      name: "Org A",
    });
    const organizationB = await createOrganization(userB.id, {
      name: "Org B",
    });
    const login = await loginTestUser(app, { email: userA.email });

    const response = await request(app)
      .get(`/api/v1/organizations/${organizationB.id}/members`)
      .set("Authorization", `Bearer ${login.accessToken}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/switch workspaces/i);
    expect(organizationA.id).not.toBe(organizationB.id);
  });
});
