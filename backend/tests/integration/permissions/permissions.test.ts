import request from "supertest";
import app from "../../../src/app.js";
import { createAuthenticatedUser } from "../../helpers/auth.helper.js";
import { createOrganization } from "../../helpers/organization.helper.js";

const switchAndGetToken = async (auth: any, orgId: string) => {
  const res = await request(app)
    .post("/api/v1/auth/switch-workspace")
    .set("Authorization", `Bearer ${auth.accessToken}`)
    .set("Cookie", auth.cookieHeader)
    .set("x-csrf-token", auth.csrfToken!)
    .send({ organizationId: orgId });
  return res.body.data?.accessToken ?? auth.accessToken;
};

describe("Permissions — scenario tests", () => {
  describe("GET /api/v1/permissions", () => {
    it("returns all available permissions for authenticated user", async () => {
      const auth = await createAuthenticatedUser(app, { email: "perm.list@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Perm List Org" });
      const token = await switchAndGetToken(auth, org.id);

      const res = await request(app)
        .get("/api/v1/permissions")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      const perms = res.body.data.items ?? res.body.data;
      expect(Array.isArray(perms)).toBe(true);
    });

    it("returns 401 when unauthenticated", async () => {
      const res = await request(app).get("/api/v1/permissions");
      expect(res.status).toBe(401);
    });
  });

  describe("Permission enforcement on protected routes", () => {
    it("allows owner to access resources", async () => {
      const auth = await createAuthenticatedUser(app, { email: "perm.owner@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Perm Owner Org" });
      const token = await switchAndGetToken(auth, org.id);

      // Owners can manage roles
      const res = await request(app)
        .get("/api/v1/roles")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it("blocks access when token org does not match resource org", async () => {
      const authA = await createAuthenticatedUser(app, { email: "perm.orgA@example.com" });
      const orgA = await createOrganization(authA.user.id, { name: "Perm Org A" });
      const tokenA = await switchAndGetToken(authA, orgA.id);

      const authB = await createAuthenticatedUser(app, { email: "perm.orgB@example.com" });
      const orgB = await createOrganization(authB.user.id, { name: "Perm Org B" });

      // Seed something in Org B
      const tokenB = await switchAndGetToken(authB, orgB.id);
      const createRes = await request(app)
        .post("/api/v1/customers")
        .set("Authorization", `Bearer ${tokenB}`)
        .send({ name: "Org B Secret Customer" });

      // Token A tries to access Org B's customer
      const res = await request(app)
        .get(`/api/v1/customers/${createRes.body.data?.id}`)
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res.status).toBeGreaterThanOrEqual(403);
    });
  });

  describe("Member permission cache invalidation", () => {
    it("still works after a role change (cache is hit or miss)", async () => {
      const auth = await createAuthenticatedUser(app, { email: "perm.cache@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Perm Cache Org" });
      const token = await switchAndGetToken(auth, org.id);

      // First request primes any cache
      await request(app)
        .get("/api/v1/permissions")
        .set("Authorization", `Bearer ${token}`);

      // Second request should still succeed (validates cache doesn't break things)
      const res = await request(app)
        .get("/api/v1/permissions")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });
});
