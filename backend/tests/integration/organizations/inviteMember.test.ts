import request from "supertest";

import app from "../../../src/app.js";
import { createTestUser, loginTestUser } from "../../helpers/auth.helper.js";
import {
  createInvitation,
  createOrganization,
} from "../../helpers/organization.helper.js";
import { prisma } from "../../setup/testDb.js";

describe("organization invitations", () => {
  it("invites a member and accepts the invitation for a new user", async () => {
    const owner = await createTestUser({ email: "owner.invite@example.com" });
    const organization = await createOrganization(owner.id, {
      name: "Invite Org",
    });
    const login = await loginTestUser(app, { email: owner.email });

    const inviteResponse = await request(app)
      .post(`/api/v1/organizations/${organization.id}/members/invite`)
      .set("Authorization", `Bearer ${login.accessToken}`)
      .send({
        email: "invited.user@example.com",
        roleName: "member",
      });

    const acceptResponse = await request(app)
      .post("/api/v1/invitations/accept")
      .send({
        token: inviteResponse.body.data.token,
        name: "Invited User",
        password: "Password123!",
      });

    const invitedUser = await prisma.user.findUniqueOrThrow({
      where: { email: "invited.user@example.com" },
    });
    const membership = await prisma.organizationMember.findFirst({
      where: {
        organizationId: organization.id,
        userId: invitedUser.id,
      },
    });

    expect(inviteResponse.status).toBe(201);
    expect(acceptResponse.status).toBe(200);
    expect(membership).not.toBeNull();
  });

  it("blocks duplicate active invitations", async () => {
    const owner = await createTestUser({ email: "dup.owner@example.com" });
    const organization = await createOrganization(owner.id, {
      name: "Duplicate Invite Org",
    });
    const login = await loginTestUser(app, { email: owner.email });

    await request(app)
      .post(`/api/v1/organizations/${organization.id}/members/invite`)
      .set("Authorization", `Bearer ${login.accessToken}`)
      .send({
        email: "duplicate@example.com",
        roleName: "member",
      });

    const response = await request(app)
      .post(`/api/v1/organizations/${organization.id}/members/invite`)
      .set("Authorization", `Bearer ${login.accessToken}`)
      .send({
        email: "duplicate@example.com",
        roleName: "member",
      });

    expect(response.status).toBe(409);
  });

  it("rejects expired invitations", async () => {
    const owner = await createTestUser({ email: "expired.owner@example.com" });
    const organization = await createOrganization(owner.id, {
      name: "Expired Invite Org",
    });

    const invitation = await createInvitation(
      organization.id,
      owner.id,
      "expired.invitee@example.com",
      "member",
    );

    await prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        expiresAt: new Date(Date.now() - 60_000),
      },
    });

    const response = await request(app).post("/api/v1/invitations/accept").send({
      token: invitation.token,
      name: "Expired Invitee",
      password: "Password123!",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/expired/i);
  });
});
