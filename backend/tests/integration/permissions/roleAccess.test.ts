import request from "supertest";

import app from "../../../src/app.js";
import { createTestUser, loginTestUser } from "../../helpers/auth.helper.js";
import { addMember, createOrganization } from "../../helpers/organization.helper.js";
import { prisma } from "../../setup/testDb.js";

describe("role access", () => {
  it("prevents a member from deleting an organization", async () => {
    const owner = await createTestUser({ email: "owner.delete@example.com" });
    const member = await createTestUser({ email: "member.delete@example.com" });
    const organization = await createOrganization(owner.id, {
      name: "Delete Control Org",
    });

    await addMember(organization.id, member.id, "member");
    const login = await loginTestUser(app, { email: member.email });

    const response = await request(app)
      .delete(`/api/v1/organizations/${organization.id}`)
      .set("Authorization", `Bearer ${login.accessToken}`);

    expect(response.status).toBe(403);
  });

  it("allows an admin to invite users", async () => {
    const owner = await createTestUser({ email: "owner.admin@example.com" });
    const admin = await createTestUser({ email: "admin.inviter@example.com" });
    const organization = await createOrganization(owner.id, {
      name: "Admin Invite Org",
    });

    await addMember(organization.id, admin.id, "admin");
    const login = await loginTestUser(app, { email: admin.email });

    const response = await request(app)
      .post(`/api/v1/organizations/${organization.id}/members/invite`)
      .set("Authorization", `Bearer ${login.accessToken}`)
      .send({
        email: "new.user@example.com",
        roleName: "member",
      });

    expect(response.status).toBe(201);
  });

  it("allows the owner to transfer ownership", async () => {
    const owner = await createTestUser({ email: "owner.transfer@example.com" });
    const target = await createTestUser({ email: "target.transfer@example.com" });
    const organization = await createOrganization(owner.id, {
      name: "Ownership Org",
    });

    const targetMembership = await addMember(organization.id, target.id, "member");
    const login = await loginTestUser(app, { email: owner.email });

    const response = await request(app)
      .post(`/api/v1/organizations/${organization.id}/transfer-ownership`)
      .set("Authorization", `Bearer ${login.accessToken}`)
      .send({ memberId: targetMembership.id });

    const updatedOrganization = await prisma.organization.findUniqueOrThrow({
      where: { id: organization.id },
    });

    expect(response.status).toBe(200);
    expect(updatedOrganization.ownerId).toBe(target.id);
  });
});
