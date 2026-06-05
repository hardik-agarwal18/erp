import request from "supertest";
import app from "../../../src/app.js";
import { createAuthenticatedUser } from "../../helpers/auth.helper.js";
import { createOrganization, getRoleByName } from "../../helpers/organization.helper.js";

const switchAndGetToken = async (auth: any, orgId: string) => {
  const res = await request(app)
    .post("/api/v1/auth/switch-workspace")
    .set("Authorization", `Bearer ${auth.accessToken}`)
    .set("Cookie", auth.cookieHeader)
    .set("x-csrf-token", auth.csrfToken!)
    .send({ organizationId: orgId });
  return res.body.data?.accessToken ?? auth.accessToken;
};

describe("Roles — scenario tests", () => {
  describe("POST /api/v1/roles", () => {
    it("creates a custom role and returns 201", async () => {
      const auth = await createAuthenticatedUser(app, { email: "role.create@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Role Create Org" });
      const token = await switchAndGetToken(auth, org.id);

      const res = await request(app)
        .post("/api/v1/roles")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "accountant", description: "Can manage finances" });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe("accountant");
    });

    it("returns 400 when name is missing", async () => {
      const auth = await createAuthenticatedUser(app, { email: "role.noname@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Role NoName Org" });
      const token = await switchAndGetToken(auth, org.id);

      const res = await request(app)
        .post("/api/v1/roles")
        .set("Authorization", `Bearer ${token}`)
        .send({ description: "No name" });

      expect(res.status).toBe(400);
    });

    it("returns 401 when not authenticated", async () => {
      const res = await request(app).post("/api/v1/roles").send({ name: "ghost" });
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/v1/roles", () => {
    it("lists roles for the authenticated org including built-in roles", async () => {
      const auth = await createAuthenticatedUser(app, { email: "role.list@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Role List Org" });
      const token = await switchAndGetToken(auth, org.id);

      const res = await request(app)
        .get("/api/v1/roles")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      const names = (res.body.data.items ?? res.body.data).map((r: any) => r.name);
      // Built-in roles should always be present
      expect(names).toContain("owner");
      expect(names).toContain("member");
    });
  });

  describe("GET /api/v1/roles/:id", () => {
    it("returns a role by ID", async () => {
      const auth = await createAuthenticatedUser(app, { email: "role.get@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Role Get Org" });
      const token = await switchAndGetToken(auth, org.id);
      const ownerRole = await getRoleByName(org.id, "owner");

      const res = await request(app)
        .get(`/api/v1/roles/${ownerRole.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("owner");
    });
  });

  describe("PUT /api/v1/roles/:id", () => {
    it("updates a custom role description", async () => {
      const auth = await createAuthenticatedUser(app, { email: "role.update@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Role Update Org" });
      const token = await switchAndGetToken(auth, org.id);

      const created = await request(app)
        .post("/api/v1/roles")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "editor", description: "Old description" });

      const res = await request(app)
        .put(`/api/v1/roles/${created.body.data.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ description: "Updated description" });

      expect(res.status).toBe(200);
      expect(res.body.data.description).toBe("Updated description");
    });
  });

  describe("Role permissions management", () => {
    it("assigns a permission to a custom role", async () => {
      const auth = await createAuthenticatedUser(app, { email: "role.perm.assign@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Role Perm Org" });
      const token = await switchAndGetToken(auth, org.id);

      // Create a custom role
      const roleRes = await request(app)
        .post("/api/v1/roles")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "custom-viewer" });
      const roleId = roleRes.body.data.id;

      // Get available permissions
      const permsRes = await request(app)
        .get("/api/v1/permissions")
        .set("Authorization", `Bearer ${token}`);
      expect(permsRes.status).toBe(200);

      const perms = permsRes.body.data.items ?? permsRes.body.data;
      if (perms.length === 0) return; // skip if no permissions seeded

      const permissionId = perms[0].id;

      // Assign permission to role
      const assignRes = await request(app)
        .post(`/api/v1/roles/${roleId}/permissions`)
        .set("Authorization", `Bearer ${token}`)
        .send({ permissionId });

      expect([200, 201]).toContain(assignRes.status);
    });
  });

  describe("DELETE /api/v1/roles/:id", () => {
    it("deletes a custom role", async () => {
      const auth = await createAuthenticatedUser(app, { email: "role.delete@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Role Delete Org" });
      const token = await switchAndGetToken(auth, org.id);

      const created = await request(app)
        .post("/api/v1/roles")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "to-delete-role" });

      const del = await request(app)
        .delete(`/api/v1/roles/${created.body.data.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(del.status).toBe(200);
    });

    it("returns 403 or 400 when trying to delete a built-in owner role", async () => {
      const auth = await createAuthenticatedUser(app, { email: "role.builtin.del@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Role BuiltIn Org" });
      const token = await switchAndGetToken(auth, org.id);
      const ownerRole = await getRoleByName(org.id, "owner");

      const del = await request(app)
        .delete(`/api/v1/roles/${ownerRole.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(del.status).toBeGreaterThanOrEqual(400);
    });
  });
});
