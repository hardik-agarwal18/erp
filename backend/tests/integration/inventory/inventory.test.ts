import request from "supertest";
import app from "../../../src/app.js";
import { createAuthenticatedUser } from "../../helpers/auth.helper.js";
import { createOrganization } from "../../helpers/organization.helper.js";
import { createProduct, createInventoryItem } from "../../helpers/entity.helper.js";

const switchAndGetToken = async (auth: any, orgId: string) => {
  const res = await request(app)
    .post("/api/v1/auth/switch-workspace")
    .set("Authorization", `Bearer ${auth.accessToken}`)
    .set("Cookie", auth.cookieHeader)
    .set("x-csrf-token", auth.csrfToken!)
    .send({ organizationId: orgId });
  return res.body.data?.accessToken ?? auth.accessToken;
};

describe("Inventory — scenario tests", () => {
  describe("GET /api/v1/inventory", () => {
    it("lists inventory items for the authenticated org", async () => {
      const auth = await createAuthenticatedUser(app, { email: "inv.list@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Inv List Org" });
      const token = await switchAndGetToken(auth, org.id);
      const product = await createProduct(org.id, { name: "Inventory Widget" });
      await createInventoryItem(org.id, product.id, 100);

      const res = await request(app)
        .get("/api/v1/inventory")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items ?? res.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ productId: product.id }),
        ]),
      );
    });
  });

  describe("GET /api/v1/inventory/:productId", () => {
    it("returns current stock level for a product", async () => {
      const auth = await createAuthenticatedUser(app, { email: "inv.get@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Inv Get Org" });
      const token = await switchAndGetToken(auth, org.id);
      const product = await createProduct(org.id, { name: "Stock Check Widget" });
      await createInventoryItem(org.id, product.id, 75);

      const res = await request(app)
        .get(`/api/v1/inventory/${product.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.quantity).toBe(75);
    });
  });

  describe("POST /api/v1/inventory/movements", () => {
    it("records an IN movement and increases stock", async () => {
      const auth = await createAuthenticatedUser(app, { email: "inv.in@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Inv IN Org" });
      const token = await switchAndGetToken(auth, org.id);
      const product = await createProduct(org.id, { name: "IN Movement Product" });
      await createInventoryItem(org.id, product.id, 10);

      const res = await request(app)
        .post("/api/v1/inventory/movements")
        .set("Authorization", `Bearer ${token}`)
        .send({ productId: product.id, type: "IN", quantity: 20, notes: "Restocked" });

      expect(res.status).toBe(201);

      // Verify stock increased
      const stockRes = await request(app)
        .get(`/api/v1/inventory/${product.id}`)
        .set("Authorization", `Bearer ${token}`);
      expect(stockRes.body.data.quantity).toBe(30);
    });

    it("records an OUT movement and decreases stock", async () => {
      const auth = await createAuthenticatedUser(app, { email: "inv.out@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Inv OUT Org" });
      const token = await switchAndGetToken(auth, org.id);
      const product = await createProduct(org.id, { name: "OUT Movement Product" });
      await createInventoryItem(org.id, product.id, 50);

      const res = await request(app)
        .post("/api/v1/inventory/movements")
        .set("Authorization", `Bearer ${token}`)
        .send({ productId: product.id, type: "OUT", quantity: 15 });

      expect(res.status).toBe(201);

      const stockRes = await request(app)
        .get(`/api/v1/inventory/${product.id}`)
        .set("Authorization", `Bearer ${token}`);
      expect(stockRes.body.data.quantity).toBe(35);
    });

    it("returns 400 when quantity exceeds available stock (OUT movement)", async () => {
      const auth = await createAuthenticatedUser(app, { email: "inv.insufficient@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Inv Insufficient Org" });
      const token = await switchAndGetToken(auth, org.id);
      const product = await createProduct(org.id, { name: "Low Stock Product" });
      await createInventoryItem(org.id, product.id, 5);

      const res = await request(app)
        .post("/api/v1/inventory/movements")
        .set("Authorization", `Bearer ${token}`)
        .send({ productId: product.id, type: "OUT", quantity: 100 });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("GET /api/v1/inventory/movements", () => {
    it("returns movement history for an org", async () => {
      const auth = await createAuthenticatedUser(app, { email: "inv.history@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Inv History Org" });
      const token = await switchAndGetToken(auth, org.id);
      const product = await createProduct(org.id, { name: "History Product" });
      await createInventoryItem(org.id, product.id, 50);

      // Create a movement first
      await request(app)
        .post("/api/v1/inventory/movements")
        .set("Authorization", `Bearer ${token}`)
        .send({ productId: product.id, type: "IN", quantity: 10 });

      const res = await request(app)
        .get("/api/v1/inventory/movements")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items ?? res.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ productId: product.id }),
        ]),
      );
    });
  });
});
