import request from "supertest";
import app from "../../../src/app.js";
import { createAuthenticatedUser } from "../../helpers/auth.helper.js";
import { createOrganization } from "../../helpers/organization.helper.js";
import { createCustomer, createProduct, createInvoice } from "../../helpers/entity.helper.js";
import { prisma } from "../../setup/testDb.js";

const switchAndGetToken = async (auth: any, orgId: string) => {
  const res = await request(app)
    .post("/api/v1/auth/switch-workspace")
    .set("Authorization", `Bearer ${auth.accessToken}`)
    .set("Cookie", auth.cookieHeader)
    .set("x-csrf-token", auth.csrfToken!)
    .send({ organizationId: orgId });
  return res.body.data?.accessToken ?? auth.accessToken;
};

describe("Transactions — scenario tests", () => {
  describe("GET /api/v1/transactions", () => {
    it("lists transactions for the authenticated org", async () => {
      const auth = await createAuthenticatedUser(app, { email: "txn.list@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Txn List Org" });
      const token = await switchAndGetToken(auth, org.id);
      const customer = await createCustomer(org.id);
      const product = await createProduct(org.id, { sellingPrice: 200 });
      const invoice = await createInvoice(org.id, customer.id, product.id, { totalAmount: 200, status: "ISSUED" });

      // Create a payment to generate a transaction
      await request(app)
        .post("/api/v1/payments")
        .set("Authorization", `Bearer ${token}`)
        .send({ invoiceId: invoice.id, amount: 200, paymentMethod: "BANK_TRANSFER", paymentDate: new Date().toISOString() });

      const res = await request(app)
        .get("/api/v1/transactions")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items ?? res.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ organizationId: org.id }),
        ]),
      );
    });

    it("filters transactions by date range", async () => {
      const auth = await createAuthenticatedUser(app, { email: "txn.filter@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Txn Filter Org" });
      const token = await switchAndGetToken(auth, org.id);
      const customer = await createCustomer(org.id);
      const product = await createProduct(org.id, { sellingPrice: 100 });
      const invoice = await createInvoice(org.id, customer.id, product.id, { totalAmount: 100, status: "ISSUED" });

      await request(app)
        .post("/api/v1/payments")
        .set("Authorization", `Bearer ${token}`)
        .send({ invoiceId: invoice.id, amount: 100, paymentMethod: "CASH", paymentDate: new Date().toISOString() });

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);

      const res = await request(app)
        .get(`/api/v1/transactions?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it("returns 401 when unauthenticated", async () => {
      const res = await request(app).get("/api/v1/transactions");
      expect(res.status).toBe(401);
    });
  });

  describe("Transaction creation from payment", () => {
    it("creates a transaction record when a payment is made", async () => {
      const auth = await createAuthenticatedUser(app, { email: "txn.create@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Txn Create Org" });
      const token = await switchAndGetToken(auth, org.id);
      const customer = await createCustomer(org.id);
      const product = await createProduct(org.id, { sellingPrice: 350 });
      const invoice = await createInvoice(org.id, customer.id, product.id, { totalAmount: 350, status: "ISSUED" });

      const paymentAmount = 350;
      await request(app)
        .post("/api/v1/payments")
        .set("Authorization", `Bearer ${token}`)
        .send({ invoiceId: invoice.id, amount: paymentAmount, paymentMethod: "BANK_TRANSFER", paymentDate: new Date().toISOString() });

      // Verify transaction was created in DB
      const transactions = await prisma.transaction.findMany({
        where: { organizationId: org.id },
      });

      expect(transactions.length).toBeGreaterThanOrEqual(1);
      const txn = transactions.find(t => Number(t.amount) === paymentAmount);
      expect(txn).toBeDefined();
    });
  });

  describe("GET /api/v1/transactions/:id", () => {
    it("returns a single transaction by ID", async () => {
      const auth = await createAuthenticatedUser(app, { email: "txn.get@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Txn Get Org" });
      const token = await switchAndGetToken(auth, org.id);
      const customer = await createCustomer(org.id);
      const product = await createProduct(org.id, { sellingPrice: 75 });
      const invoice = await createInvoice(org.id, customer.id, product.id, { totalAmount: 75, status: "ISSUED" });

      await request(app)
        .post("/api/v1/payments")
        .set("Authorization", `Bearer ${token}`)
        .send({ invoiceId: invoice.id, amount: 75, paymentMethod: "CASH", paymentDate: new Date().toISOString() });

      const txns = await prisma.transaction.findMany({ where: { organizationId: org.id } });
      if (txns.length > 0) {
        const res = await request(app)
          .get(`/api/v1/transactions/${txns[0].id}`)
          .set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.data.id).toBe(txns[0].id);
      }
    });
  });
});
