import request from "supertest";

import app from "../../../src/app.js";
import { createTestUser, loginTestUser } from "../../helpers/auth.helper.js";
import { addMember, createOrganization } from "../../helpers/organization.helper.js";

describe("permission middleware", () => {
  it("returns 400 when tenant context is missing for organization-scoped routes", async () => {
    const user = await createTestUser({ email: "no.workspace@example.com" });
    const login = await loginTestUser(app, { email: user.email });

    const response = await request(app)
      .get("/api/v1/roles")
      .set("Authorization", `Bearer ${login.accessToken}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/organization context/i);
  });

  it("denies role creation to members without roles.manage", async () => {
    const owner = await createTestUser({ email: "owner.roles@example.com" });
    const member = await createTestUser({ email: "member.roles@example.com" });
    const organization = await createOrganization(owner.id, {
      name: "Role Permission Org",
    });

    await addMember(organization.id, member.id, "member");
    const login = await loginTestUser(app, { email: member.email });

    const response = await request(app)
      .post("/api/v1/roles")
      .set("Authorization", `Bearer ${login.accessToken}`)
      .send({
        name: "auditor",
        permissionNames: ["organization.view"],
      });

    expect(response.status).toBe(403);
  });

  it("blocks tenant mismatch when the header organization differs from the token workspace", async () => {
    const user = await createTestUser({ email: "tenant.mismatch@example.com" });
    const organizationA = await createOrganization(user.id, {
      name: "Tenant A",
    });
    const organizationB = await createOrganization(user.id, {
      name: "Tenant B",
    });
    const login = await loginTestUser(app, { email: user.email });

    const response = await request(app)
      .get("/api/v1/permissions")
      .set("Authorization", `Bearer ${login.accessToken}`)
      .set("x-organization-id", organizationB.id);

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/switch workspaces/i);
    expect(organizationA.id).not.toBe(organizationB.id);
  });
});
