import request from "supertest";

import app from "../../../src/app.js";
import { createTestUser, loginTestUser } from "../../helpers/auth.helper.js";
import { addMember, createOrganization, getRoleByName } from "../../helpers/organization.helper.js";

describe("privilege escalation protection", () => {
  it("prevents an admin from promoting a member to admin", async () => {
    const owner = await createTestUser({ email: "owner.escalation@example.com" });
    const admin = await createTestUser({ email: "admin.escalation@example.com" });
    const member = await createTestUser({ email: "member.escalation@example.com" });
    const organization = await createOrganization(owner.id, {
      name: "Escalation Org",
    });

    await addMember(organization.id, admin.id, "admin");
    const targetMembership = await addMember(organization.id, member.id, "member");
    const adminRole = await getRoleByName(organization.id, "admin");
    const login = await loginTestUser(app, { email: admin.email });

    const response = await request(app)
      .patch(`/api/v1/organizations/${organization.id}/members/${targetMembership.id}`)
      .set("Authorization", `Bearer ${login.accessToken}`)
      .send({ roleId: adminRole.id });

    expect(response.status).toBe(403);
  });

  it("prevents an admin from transferring ownership", async () => {
    const owner = await createTestUser({ email: "owner.transfer.guard@example.com" });
    const admin = await createTestUser({ email: "admin.transfer.guard@example.com" });
    const organization = await createOrganization(owner.id, {
      name: "Transfer Guard Org",
    });

    const adminMembership = await addMember(organization.id, admin.id, "admin");
    const login = await loginTestUser(app, { email: admin.email });

    const response = await request(app)
      .post(`/api/v1/organizations/${organization.id}/transfer-ownership`)
      .set("Authorization", `Bearer ${login.accessToken}`)
      .send({ memberId: adminMembership.id });

    expect(response.status).toBe(403);
  });
});
