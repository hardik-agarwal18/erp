import request from "supertest";
import app from "../../../src/app.js";
import { createAuthenticatedUser } from "../../helpers/auth.helper.js";
import { createOrganization } from "../../helpers/organization.helper.js";
import { createTax } from "../../helpers/entity.helper.js";

const switchAndGetToken = async (auth: any, orgId: string) => {
  const res = await request(app)
    .post("/api/v1/auth/switch-workspace")
    .set("Authorization", `Bearer ${auth.accessToken}`)
    .set("Cookie", auth.cookieHeader)
    .set("x-csrf-token", auth.csrfToken!)
    .send({ organizationId: orgId });
  return res.body.data?.accessToken ?? auth.accessToken;
};

describe("Taxes — scenario tests", () => {
  describe("POST /api/v1/taxes", () => {
    it("creates a tax rate and returns 201", async () => {
      const auth = await createAuthenticatedUser(app, { email: "tax.create@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Tax Create Org" });
      const token = await switchAndGetToken(auth, org.id);

      const res = await request(app)
        .post("/api/v1/taxes")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "GST 18%", rate: 18, type: "GST" });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe("GST 18%");
      expect(res.body.data.rate).toBe(18);
    });

    it("returns 400 when rate is missing", async () => {
      const auth = await createAuthenticatedUser(app, { email: "tax.norate@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Tax NoRate Org" });
      const token = await switchAndGetToken(auth, org.id);

      const res = await request(app)
        .post("/api/v1/taxes")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "No Rate Tax", type: "GST" });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/v1/taxes", () => {
    it("lists taxes for the authenticated org only", async () => {
      const authA = await createAuthenticatedUser(app, { email: "tax.list.a@example.com" });
      const orgA = await createOrganization(authA.user.id, { name: "Tax List Org A" });
      const tokenA = await switchAndGetToken(authA, orgA.id);

      const authB = await createAuthenticatedUser(app, { email: "tax.list.b@example.com" });
      const orgB = await createOrganization(authB.user.id, { name: "Tax List Org B" });

      await createTax(orgA.id, { name: "Tax A" });
      await createTax(orgB.id, { name: "Tax B" });

      const res = await request(app)
        .get("/api/v1/taxes")
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      const names = res.body.data.items?.map((t: any) => t.name) ?? res.body.data.map((t: any) => t.name);
      expect(names.some((n: string) => n === "Tax A")).toBe(true);
      expect(names.some((n: string) => n === "Tax B")).toBe(false);
    });
  });

  describe("GET /api/v1/taxes/:id", () => {
    it("returns a tax by ID", async () => {
      const auth = await createAuthenticatedUser(app, { email: "tax.get@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Tax Get Org" });
      const token = await switchAndGetToken(auth, org.id);
      const tax = await createTax(org.id, { name: "Findable Tax" });

      const res = await request(app)
        .get(`/api/v1/taxes/${tax.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(tax.id);
    });
  });

  describe("PUT /api/v1/taxes/:id", () => {
    it("updates the tax rate", async () => {
      const auth = await createAuthenticatedUser(app, { email: "tax.update@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Tax Update Org" });
      const token = await switchAndGetToken(auth, org.id);
      const tax = await createTax(org.id, { name: "Update Tax", rate: 10 });

      const res = await request(app)
        .put(`/api/v1/taxes/${tax.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ rate: 20 });

      expect(res.status).toBe(200);
      expect(res.body.data.rate).toBe(20);
    });
  });

  describe("DELETE /api/v1/taxes/:id", () => {
    it("deletes an unused tax", async () => {
      const auth = await createAuthenticatedUser(app, { email: "tax.delete@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Tax Delete Org" });
      const token = await switchAndGetToken(auth, org.id);
      const tax = await createTax(org.id, { name: "Delete Tax" });

      const del = await request(app)
        .delete(`/api/v1/taxes/${tax.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(del.status).toBe(200);
    });
  });
});
