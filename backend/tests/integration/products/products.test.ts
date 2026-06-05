import request from "supertest";
import app from "../../../src/app.js";
import { createAuthenticatedUser } from "../../helpers/auth.helper.js";
import { createOrganization } from "../../helpers/organization.helper.js";
import { createProduct, createTax } from "../../helpers/entity.helper.js";

const switchAndGetToken = async (auth: any, orgId: string) => {
  const res = await request(app)
    .post("/api/v1/auth/switch-workspace")
    .set("Cookie", auth.cookieHeader)
    .set("x-csrf-token", auth.csrfToken!)
    .send({ organizationId: orgId });
  return res.body.data?.accessToken ?? auth.accessToken;
};

describe("Products — scenario tests", () => {
  describe("POST /api/v1/products", () => {
    it("creates a physical product and returns 201", async () => {
      const auth = await createAuthenticatedUser(app, { email: "prod.create@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Prod Create Org" });
      const token = await switchAndGetToken(auth, org.id);

      const res = await request(app)
        .post("/api/v1/products")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Widget A", type: "PHYSICAL", sellingPrice: 99.99 });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe("Widget A");
      expect(res.body.data.sellingPrice).toBe(99.99);
    });

    it("creates a product with a tax applied", async () => {
      const auth = await createAuthenticatedUser(app, { email: "prod.withtax@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Prod Tax Org" });
      const token = await switchAndGetToken(auth, org.id);
      const tax = await createTax(org.id, { name: "VAT 10%", rate: 10 });

      const res = await request(app)
        .post("/api/v1/products")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Taxed Widget", type: "SERVICE", sellingPrice: 50, taxId: tax.id });

      expect(res.status).toBe(201);
      expect(res.body.data.taxId).toBe(tax.id);
    });

    it("returns 400 when required fields are missing", async () => {
      const auth = await createAuthenticatedUser(app, { email: "prod.invalid@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Prod Invalid Org" });
      const token = await switchAndGetToken(auth, org.id);

      const res = await request(app)
        .post("/api/v1/products")
        .set("Authorization", `Bearer ${token}`)
        .send({ type: "PHYSICAL" }); // missing name, sellingPrice

      expect(res.status).toBe(400);
    });

    it("returns 401 when unauthenticated", async () => {
      const res = await request(app)
        .post("/api/v1/products")
        .send({ name: "Ghost Product", type: "PHYSICAL", sellingPrice: 10 });
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/v1/products", () => {
    it("lists only products belonging to the authenticated org", async () => {
      const authA = await createAuthenticatedUser(app, { email: "prod.list.a@example.com" });
      const orgA = await createOrganization(authA.user.id, { name: "Prod List Org A" });
      const tokenA = await switchAndGetToken(authA, orgA.id);

      const authB = await createAuthenticatedUser(app, { email: "prod.list.b@example.com" });
      const orgB = await createOrganization(authB.user.id, { name: "Prod List Org B" });

      await createProduct(orgA.id, { name: "Org A Product" });
      await createProduct(orgB.id, { name: "Org B Product" });

      const res = await request(app)
        .get("/api/v1/products")
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      const names = res.body.data.items.map((p: any) => p.name);
      expect(names).toContain("Org A Product");
      expect(names).not.toContain("Org B Product");
    });
  });

  describe("GET /api/v1/products/:id", () => {
    it("returns a product by ID", async () => {
      const auth = await createAuthenticatedUser(app, { email: "prod.get@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Prod Get Org" });
      const token = await switchAndGetToken(auth, org.id);
      const product = await createProduct(org.id, { name: "Findable Product" });

      const res = await request(app)
        .get(`/api/v1/products/${product.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(product.id);
    });

    it("returns 404 for non-existent product", async () => {
      const auth = await createAuthenticatedUser(app, { email: "prod.404@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Prod 404 Org" });
      const token = await switchAndGetToken(auth, org.id);

      const res = await request(app)
        .get("/api/v1/products/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/v1/products/:id", () => {
    it("updates product price", async () => {
      const auth = await createAuthenticatedUser(app, { email: "prod.update@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Prod Update Org" });
      const token = await switchAndGetToken(auth, org.id);
      const product = await createProduct(org.id, { name: "Update Product", sellingPrice: 50 });

      const res = await request(app)
        .put(`/api/v1/products/${product.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ sellingPrice: 75 });

      expect(res.status).toBe(200);
      expect(res.body.data.sellingPrice).toBe(75);
    });
  });

  describe("DELETE /api/v1/products/:id", () => {
    it("deletes a product", async () => {
      const auth = await createAuthenticatedUser(app, { email: "prod.delete@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Prod Delete Org" });
      const token = await switchAndGetToken(auth, org.id);
      const product = await createProduct(org.id, { name: "Delete Product" });

      const del = await request(app)
        .delete(`/api/v1/products/${product.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(del.status).toBe(200);

      const get = await request(app)
        .get(`/api/v1/products/${product.id}`)
        .set("Authorization", `Bearer ${token}`);
      expect(get.status).toBe(404);
    });
  });
});
