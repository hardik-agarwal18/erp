import request from "supertest";
import app from "../../../src/app.js";
import { createAuthenticatedUser } from "../../helpers/auth.helper.js";
import { createOrganization } from "../../helpers/organization.helper.js";
import { createVendor } from "../../helpers/entity.helper.js";

const switchAndGetToken = async (auth: any, orgId: string) => {
  const res = await request(app)
    .post("/api/v1/auth/switch-workspace")
    .set("Authorization", `Bearer ${auth.accessToken}`)
    .set("Cookie", auth.cookieHeader)
    .set("x-csrf-token", auth.csrfToken!)
    .send({ organizationId: orgId });
  return res.body.data?.accessToken ?? auth.accessToken;
};

describe("Vendors — scenario tests", () => {
  describe("POST /api/v1/vendors", () => {
    it("creates a vendor and returns 201", async () => {
      const auth = await createAuthenticatedUser(app, { email: "vendor.create@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Vendor Create Org" });
      const token = await switchAndGetToken(auth, org.id);

      const res = await request(app)
        .post("/api/v1/vendors")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Global Supplies Inc", email: "supplies@vendor.com", phone: "+19998887777" });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe("Global Supplies Inc");
    });

    it("returns 400 when name is missing", async () => {
      const auth = await createAuthenticatedUser(app, { email: "vendor.noname@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Vendor NoName Org" });
      const token = await switchAndGetToken(auth, org.id);

      const res = await request(app)
        .post("/api/v1/vendors")
        .set("Authorization", `Bearer ${token}`)
        .send({ email: "noname@vendor.com" });

      expect(res.status).toBe(400);
    });

    it("returns 401 when unauthenticated", async () => {
      const res = await request(app).post("/api/v1/vendors").send({ name: "Ghost Vendor" });
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/v1/vendors", () => {
    it("lists only vendors in the authenticated org", async () => {
      const authA = await createAuthenticatedUser(app, { email: "vendor.list.a@example.com" });
      const orgA = await createOrganization(authA.user.id, { name: "Vendor List Org A" });
      const tokenA = await switchAndGetToken(authA, orgA.id);

      const authB = await createAuthenticatedUser(app, { email: "vendor.list.b@example.com" });
      const orgB = await createOrganization(authB.user.id, { name: "Vendor List Org B" });

      await createVendor(orgA.id, { name: "Vendor A" });
      await createVendor(orgB.id, { name: "Vendor B" });

      const res = await request(app)
        .get("/api/v1/vendors")
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      const names = res.body.data.items.map((v: any) => v.name);
      expect(names).toContain("Vendor A");
      expect(names).not.toContain("Vendor B");
    });
  });

  describe("GET /api/v1/vendors/:id", () => {
    it("returns a vendor by ID", async () => {
      const auth = await createAuthenticatedUser(app, { email: "vendor.get@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Vendor Get Org" });
      const token = await switchAndGetToken(auth, org.id);
      const vendor = await createVendor(org.id, { name: "Findable Vendor" });

      const res = await request(app)
        .get(`/api/v1/vendors/${vendor.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Findable Vendor");
    });

    it("returns 404 for non-existent vendor", async () => {
      const auth = await createAuthenticatedUser(app, { email: "vendor.404@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Vendor 404 Org" });
      const token = await switchAndGetToken(auth, org.id);

      const res = await request(app)
        .get("/api/v1/vendors/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/v1/vendors/:id", () => {
    it("updates vendor name", async () => {
      const auth = await createAuthenticatedUser(app, { email: "vendor.update@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Vendor Update Org" });
      const token = await switchAndGetToken(auth, org.id);
      const vendor = await createVendor(org.id, { name: "Old Vendor Name" });

      const res = await request(app)
        .patch(`/api/v1/vendors/${vendor.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated Vendor Name" });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Updated Vendor Name");
    });
  });

  describe("DELETE /api/v1/vendors/:id", () => {
    it("deletes a vendor", async () => {
      const auth = await createAuthenticatedUser(app, { email: "vendor.delete@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Vendor Delete Org" });
      const token = await switchAndGetToken(auth, org.id);
      const vendor = await createVendor(org.id, { name: "Delete Vendor" });

      const del = await request(app)
        .delete(`/api/v1/vendors/${vendor.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(del.status).toBe(200);

      const get = await request(app)
        .get(`/api/v1/vendors/${vendor.id}`)
        .set("Authorization", `Bearer ${token}`);
      expect(get.status).toBe(404);
    });
  });
});
