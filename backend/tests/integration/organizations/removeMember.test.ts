import request from "supertest";

import app from "../../../src/app.js";
import { createTestUser, loginTestUser } from "../../helpers/auth.helper.js";
import { addMember, createOrganization } from "../../helpers/organization.helper.js";
import { prisma } from "../../setup/testDb.js";

describe("remove member", () => {
  it("allows an owner to remove a member", async () => {
    const owner = await createTestUser({ email: "remove.owner@example.com" });
    const member = await createTestUser({ email: "remove.member@example.com" });
    const organization = await createOrganization(owner.id, {
      name: "Remove Org",
    });
    const membership = await addMember(organization.id, member.id, "member");
    const login = await loginTestUser(app, { email: owner.email });

    const response = await request(app)
      .delete(`/api/v1/organizations/${organization.id}/members/${membership.id}`)
      .set("Authorization", `Bearer ${login.accessToken}`);

    const deletedMembership = await prisma.organizationMember.findUnique({
      where: { id: membership.id },
    });

    expect(response.status).toBe(200);
    expect(deletedMembership).toBeNull();
  });

  it("prevents a regular member from removing another member", async () => {
    const owner = await createTestUser({ email: "owner.security@example.com" });
    const actor = await createTestUser({ email: "actor.member@example.com" });
    const target = await createTestUser({ email: "target.member@example.com" });
    const organization = await createOrganization(owner.id, {
      name: "Security Org",
    });
    await addMember(organization.id, actor.id, "member");
    const targetMembership = await addMember(organization.id, target.id, "member");
    const login = await loginTestUser(app, { email: actor.email });

    const response = await request(app)
      .delete(`/api/v1/organizations/${organization.id}/members/${targetMembership.id}`)
      .set("Authorization", `Bearer ${login.accessToken}`);

    expect(response.status).toBe(403);
  });
});
