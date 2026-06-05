import request from "supertest";
import app from "../../../src/app.js";
import { createAuthenticatedUser } from "../../helpers/auth.helper.js";
import { createOrganization } from "../../helpers/organization.helper.js";
import { createCustomer, createProduct, createInvoice } from "../../helpers/entity.helper.js";

const switchAndGetToken = async (auth: any, orgId: string) => {
  const res = await request(app)
    .post("/api/v1/auth/switch-workspace")
    .set("Authorization", `Bearer ${auth.accessToken}`)
    .set("Cookie", auth.cookieHeader)
    .set("x-csrf-token", auth.csrfToken!)
    .send({ organizationId: orgId });
  return res.body.data?.accessToken ?? auth.accessToken;
};

describe("Payments — scenario tests", () => {
  describe("POST /api/v1/payments", () => {
    it("records a full payment against an invoice and returns 201", async () => {
      const auth = await createAuthenticatedUser(app, { email: "pay.full@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Pay Full Org" });
      const token = await switchAndGetToken(auth, org.id);
      const customer = await createCustomer(org.id);
      const product = await createProduct(org.id, { sellingPrice: 500 });
      const invoice = await createInvoice(org.id, customer.id, product.id, {
        totalAmount: 500,
        status: "ISSUED",
      });

      const res = await request(app)
        .post("/api/v1/payments")
        .set("Authorization", `Bearer ${token}`)
        .send({
          invoiceId: invoice.id,
          amount: 500,
          method: "BANK_TRANSFER",
          paidAt: new Date().toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.data.amount).toBe(500);
      expect(res.body.data.invoiceId).toBe(invoice.id);
    });

    it("records a partial payment", async () => {
      const auth = await createAuthenticatedUser(app, { email: "pay.partial@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Pay Partial Org" });
      const token = await switchAndGetToken(auth, org.id);
      const customer = await createCustomer(org.id);
      const product = await createProduct(org.id, { sellingPrice: 1000 });
      const invoice = await createInvoice(org.id, customer.id, product.id, {
        totalAmount: 1000,
        status: "ISSUED",
      });

      const res = await request(app)
        .post("/api/v1/payments")
        .set("Authorization", `Bearer ${token}`)
        .send({ invoiceId: invoice.id, amount: 400, method: "CASH", paidAt: new Date().toISOString() });

      expect(res.status).toBe(201);
      expect(res.body.data.amount).toBe(400);
    });

    it("returns 400 when amount exceeds invoice total", async () => {
      const auth = await createAuthenticatedUser(app, { email: "pay.over@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Pay Over Org" });
      const token = await switchAndGetToken(auth, org.id);
      const customer = await createCustomer(org.id);
      const product = await createProduct(org.id, { sellingPrice: 100 });
      const invoice = await createInvoice(org.id, customer.id, product.id, {
        totalAmount: 100,
        status: "ISSUED",
      });

      const res = await request(app)
        .post("/api/v1/payments")
        .set("Authorization", `Bearer ${token}`)
        .send({ invoiceId: invoice.id, amount: 9999, method: "BANK_TRANSFER", paidAt: new Date().toISOString() });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it("returns 400 when invoiceId is missing", async () => {
      const auth = await createAuthenticatedUser(app, { email: "pay.noinv@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Pay NoInv Org" });
      const token = await switchAndGetToken(auth, org.id);

      const res = await request(app)
        .post("/api/v1/payments")
        .set("Authorization", `Bearer ${token}`)
        .send({ amount: 100, method: "CASH", paidAt: new Date().toISOString() });

      expect(res.status).toBe(400);
    });

    it("returns 401 when unauthenticated", async () => {
      const res = await request(app).post("/api/v1/payments").send({});
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/v1/payments", () => {
    it("lists payments for the authenticated org only", async () => {
      const authA = await createAuthenticatedUser(app, { email: "pay.list.a@example.com" });
      const orgA = await createOrganization(authA.user.id, { name: "Pay List Org A" });
      const tokenA = await switchAndGetToken(authA, orgA.id);

      const authB = await createAuthenticatedUser(app, { email: "pay.list.b@example.com" });
      const orgB = await createOrganization(authB.user.id, { name: "Pay List Org B" });

      const custA = await createCustomer(orgA.id);
      const prodA = await createProduct(orgA.id, { sellingPrice: 200 });
      const invA = await createInvoice(orgA.id, custA.id, prodA.id, { totalAmount: 200, status: "ISSUED" });

      const custB = await createCustomer(orgB.id);
      const prodB = await createProduct(orgB.id, { sellingPrice: 300 });
      const invB = await createInvoice(orgB.id, custB.id, prodB.id, { totalAmount: 300, status: "ISSUED" });

      // Create payments for both orgs
      await request(app)
        .post("/api/v1/payments")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ invoiceId: invA.id, amount: 200, method: "CASH", paidAt: new Date().toISOString() });

      const tokenB = await switchAndGetToken(authB, orgB.id);
      await request(app)
        .post("/api/v1/payments")
        .set("Authorization", `Bearer ${tokenB}`)
        .send({ invoiceId: invB.id, amount: 300, method: "CASH", paidAt: new Date().toISOString() });

      const res = await request(app)
        .get("/api/v1/payments")
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      const invoiceIds = (res.body.data.items ?? res.body.data).map((p: any) => p.invoiceId);
      expect(invoiceIds).toContain(invA.id);
      expect(invoiceIds).not.toContain(invB.id);
    });
  });

  describe("DELETE /api/v1/payments/:id", () => {
    it("deletes a payment (refund scenario)", async () => {
      const auth = await createAuthenticatedUser(app, { email: "pay.del@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Pay Del Org" });
      const token = await switchAndGetToken(auth, org.id);
      const customer = await createCustomer(org.id);
      const product = await createProduct(org.id, { sellingPrice: 100 });
      const invoice = await createInvoice(org.id, customer.id, product.id, { totalAmount: 100, status: "ISSUED" });

      const createRes = await request(app)
        .post("/api/v1/payments")
        .set("Authorization", `Bearer ${token}`)
        .send({ invoiceId: invoice.id, amount: 100, method: "CASH", paidAt: new Date().toISOString() });

      const del = await request(app)
        .delete(`/api/v1/payments/${createRes.body.data.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(del.status).toBe(200);
    });
  });
});
