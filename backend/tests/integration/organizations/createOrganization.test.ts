import request from "supertest";

import app from "../../../src/app.js";
import { createAuthenticatedUser } from "../../helpers/auth.helper.js";
import { prisma } from "../../setup/testDb.js";

describe("create organization", () => {
  it("creates an organization and owner membership for an authenticated user", async () => {
    const auth = await createAuthenticatedUser(app, {
      email: "org.creator@example.com",
    });

    const response = await request(app)
      .post("/api/v1/organizations")
      .set("Authorization", `Bearer ${auth.accessToken}`)
      .send({ name: "Created Organization" });

    const organization = await prisma.organization.findUniqueOrThrow({
      where: { id: response.body.data.id },
    });
    const membership = await prisma.organizationMember.findFirstOrThrow({
      where: {
        organizationId: organization.id,
        userId: auth.user.id,
      },
      include: {
        role: true,
      },
    });

    expect(response.status).toBe(201);
    expect(organization.slug).toBe("created-organization");
    expect(membership.role.name).toBe("owner");
  });

  it("generates unique slugs for repeated organization names", async () => {
    const auth = await createAuthenticatedUser(app, {
      email: "slug.user@example.com",
    });

    const first = await request(app)
      .post("/api/v1/organizations")
      .set("Authorization", `Bearer ${auth.accessToken}`)
      .send({ name: "Acme" });
    const second = await request(app)
      .post("/api/v1/organizations")
      .set("Authorization", `Bearer ${auth.accessToken}`)
      .send({ name: "Acme" });

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(first.body.data.slug).toBe("acme");
    expect(second.body.data.slug).toBe("acme-2");
  });
});
