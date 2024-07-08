import request from "supertest";
import app from "../../../src/app.js";
import { createAuthenticatedUser } from "../../helpers/auth.helper.js";
import { createOrganization } from "../../helpers/organization.helper.js";
import { createCustomer } from "../../helpers/entity.helper.js";

describe("Customers — scenario tests", () => {
  // ── CREATE ──────────────────────────────────────────────────────────────────
  describe("POST /api/v1/customers", () => {
    it("creates a customer and returns 201", async () => {
      const auth = await createAuthenticatedUser(app, { email: "cust.create@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Cust Create Org" });
      const tokenRes = await request(app)
        .post("/api/v1/auth/switch-workspace")
        .set("Authorization", `Bearer ${auth.accessToken}`)
        .set("Cookie", auth.cookieHeader)
        .set("x-csrf-token", auth.csrfToken!)
        .send({ organizationId: org.id });
      const accessToken = tokenRes.body.data?.accessToken ?? auth.accessToken;

      const res = await request(app)
        .post("/api/v1/customers")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ name: "ACME Corp", email: "acme@example.com", phone: "+1234567890" });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe("ACME Corp");
      expect(res.body.data.organizationId).toBe(org.id);
    });

    it("returns 400 when name is missing", async () => {
      const auth = await createAuthenticatedUser(app, { email: "cust.noname@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Cust NoName Org" });
      const tokenRes = await request(app)
        .post("/api/v1/auth/switch-workspace")
        .set("Authorization", `Bearer ${auth.accessToken}`)
        .set("Cookie", auth.cookieHeader)
        .set("x-csrf-token", auth.csrfToken!)
        .send({ organizationId: org.id });
      const accessToken = tokenRes.body.data?.accessToken ?? auth.accessToken;

      const res = await request(app)
        .post("/api/v1/customers")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ email: "test@example.com" });

      expect(res.status).toBe(400);
    });

    it("returns 401 when not authenticated", async () => {
      const res = await request(app)
        .post("/api/v1/customers")
        .send({ name: "Ghost Corp" });

      expect(res.status).toBe(401);
    });
  });

  // ── LIST ────────────────────────────────────────────────────────────────────
  describe("GET /api/v1/customers", () => {
    it("lists only customers belonging to the authenticated org", async () => {
      const authA = await createAuthenticatedUser(app, { email: "cust.list.a@example.com" });
      const orgA = await createOrganization(authA.user.id, { name: "Cust List Org A" });
      const tokenResA = await request(app)
        .post("/api/v1/auth/switch-workspace")
        .set("Authorization", `Bearer ${authA.accessToken}`)
        .set("Cookie", authA.cookieHeader)
        .set("x-csrf-token", authA.csrfToken!)
        .send({ organizationId: orgA.id });
      const tokenA = tokenResA.body.data?.accessToken ?? authA.accessToken;

      const authB = await createAuthenticatedUser(app, { email: "cust.list.b@example.com" });
      const orgB = await createOrganization(authB.user.id, { name: "Cust List Org B" });

      await createCustomer(orgA.id, { name: "Org A Customer" });
      await createCustomer(orgB.id, { name: "Org B Customer" });

      const res = await request(app)
        .get("/api/v1/customers")
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      const names = res.body.data.items.map((c: any) => c.name);
      expect(names).toContain("Org A Customer");
      expect(names).not.toContain("Org B Customer");
    });

    it("supports pagination with page and limit params", async () => {
      const auth = await createAuthenticatedUser(app, { email: "cust.page@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Cust Page Org" });
      const tokenRes = await request(app)
        .post("/api/v1/auth/switch-workspace")
        .set("Authorization", `Bearer ${auth.accessToken}`)
        .set("Cookie", auth.cookieHeader)
        .set("x-csrf-token", auth.csrfToken!)
        .send({ organizationId: org.id });
      const accessToken = tokenRes.body.data?.accessToken ?? auth.accessToken;

      await Promise.all([1, 2, 3].map(i => createCustomer(org.id, { name: `Page Cust ${i}` })));

      const res = await request(app)
        .get("/api/v1/customers?page=1&limit=2")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(2);
      expect(res.body.data.page).toBeDefined();
      expect(res.body.data.total).toBeDefined();
    });
  });

  // ── GET BY ID ───────────────────────────────────────────────────────────────
  describe("GET /api/v1/customers/:id", () => {
    it("returns a customer by ID", async () => {
      const auth = await createAuthenticatedUser(app, { email: "cust.get@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Cust Get Org" });
      const tokenRes = await request(app)
        .post("/api/v1/auth/switch-workspace")
        .set("Authorization", `Bearer ${auth.accessToken}`)
        .set("Cookie", auth.cookieHeader)
        .set("x-csrf-token", auth.csrfToken!)
        .send({ organizationId: org.id });
      const accessToken = tokenRes.body.data?.accessToken ?? auth.accessToken;
      const customer = await createCustomer(org.id, { name: "Findable Customer" });

      const res = await request(app)
        .get(`/api/v1/customers/${customer.id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(customer.id);
      expect(res.body.data.name).toBe("Findable Customer");
    });

    it("returns 404 for a non-existent customer", async () => {
      const auth = await createAuthenticatedUser(app, { email: "cust.404@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Cust 404 Org" });
      const tokenRes = await request(app)
        .post("/api/v1/auth/switch-workspace")
        .set("Authorization", `Bearer ${auth.accessToken}`)
        .set("Cookie", auth.cookieHeader)
        .set("x-csrf-token", auth.csrfToken!)
        .send({ organizationId: org.id });
      const accessToken = tokenRes.body.data?.accessToken ?? auth.accessToken;

      const res = await request(app)
        .get("/api/v1/customers/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ── UPDATE ──────────────────────────────────────────────────────────────────
  describe("PUT /api/v1/customers/:id", () => {
    it("updates a customer's name", async () => {
      const auth = await createAuthenticatedUser(app, { email: "cust.update@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Cust Update Org" });
      const tokenRes = await request(app)
        .post("/api/v1/auth/switch-workspace")
        .set("Authorization", `Bearer ${auth.accessToken}`)
        .set("Cookie", auth.cookieHeader)
        .set("x-csrf-token", auth.csrfToken!)
        .send({ organizationId: org.id });
      const accessToken = tokenRes.body.data?.accessToken ?? auth.accessToken;
      const customer = await createCustomer(org.id, { name: "Old Name" });

      const res = await request(app)
        .patch(`/api/v1/customers/${customer.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ name: "New Name" });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("New Name");
    });
  });

  // ── DELETE ──────────────────────────────────────────────────────────────────
  describe("DELETE /api/v1/customers/:id", () => {
    it("deletes a customer and returns 200", async () => {
      const auth = await createAuthenticatedUser(app, { email: "cust.delete@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Cust Delete Org" });
      const tokenRes = await request(app)
        .post("/api/v1/auth/switch-workspace")
        .set("Authorization", `Bearer ${auth.accessToken}`)
        .set("Cookie", auth.cookieHeader)
        .set("x-csrf-token", auth.csrfToken!)
        .send({ organizationId: org.id });
      const accessToken = tokenRes.body.data?.accessToken ?? auth.accessToken;
      const customer = await createCustomer(org.id, { name: "Delete Me" });

      const del = await request(app)
        .delete(`/api/v1/customers/${customer.id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(del.status).toBe(200);

      const get = await request(app)
        .get(`/api/v1/customers/${customer.id}`)
        .set("Authorization", `Bearer ${accessToken}`);
      expect(get.status).toBe(404);
    });
  });
});
