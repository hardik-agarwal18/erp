import express from "express";
import request from "supertest";

import { authMiddleware } from "../../../src/middleware/auth.middleware.js";
import { errorMiddleware } from "../../../src/middleware/error.middleware.js";
import { tenantContextMiddleware } from "../../../src/middleware/tenant.middleware.js";
import { createTestUser } from "../../helpers/auth.helper.js";
import { createOrganization } from "../../helpers/organization.helper.js";
import { generateAccessTokenForTest } from "../../helpers/token.helper.js";
import { prisma } from "../../setup/testDb.js";

describe("tenant middleware", () => {
  const middlewareApp = () => {
    const testApp = express();
    testApp.get(
      "/probe/:id",
      authMiddleware,
      tenantContextMiddleware({ allowRouteParam: true }),
      (req, res) => {
        res.json({
          success: true,
          data: {
            organizationId: req.organization?.id,
            memberId: req.member?.id,
            role: req.member?.roleName,
            permissions: req.permissions,
          },
        });
      },
    );
    testApp.use(errorMiddleware);
    return testApp;
  };

  it("injects tenant context for a valid organization member", async () => {
    const owner = await createTestUser({ email: "tenant.owner@example.com" });
    const organization = await createOrganization(owner.id, {
      name: "Tenant Middleware Org",
    });
    const membership = await prisma.organizationMember.findFirstOrThrow({
      where: { organizationId: organization.id, userId: owner.id },
    });

    const token = generateAccessTokenForTest(owner.id, {
      organizationId: organization.id,
      membershipId: membership.id,
      role: "owner",
    });

    const response = await request(middlewareApp())
      .get(`/probe/${organization.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.organizationId).toBe(organization.id);
    expect(response.body.data.memberId).toBe(membership.id);
    expect(response.body.data.role).toBe("owner");
  });

  it("blocks cross-organization access", async () => {
    const user = await createTestUser({ email: "tenant.cross@example.com" });
    const organizationA = await createOrganization(user.id, { name: "Tenant A" });
    const organizationB = await createOrganization(user.id, { name: "Tenant B" });
    const membership = await prisma.organizationMember.findFirstOrThrow({
      where: { organizationId: organizationA.id, userId: user.id },
    });

    const token = generateAccessTokenForTest(user.id, {
      organizationId: organizationA.id,
      membershipId: membership.id,
      role: "owner",
    });

    const response = await request(middlewareApp())
      .get(`/probe/${organizationB.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/switch workspaces/i);
  });
});
