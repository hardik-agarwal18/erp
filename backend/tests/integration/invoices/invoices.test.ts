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

describe("Invoices — scenario tests", () => {
  describe("POST /api/v1/invoices", () => {
    it("creates an invoice with line items and returns 201", async () => {
      const auth = await createAuthenticatedUser(app, { email: "inv.create@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Inv Create Org" });
      const token = await switchAndGetToken(auth, org.id);
      const customer = await createCustomer(org.id, { name: "Invoice Customer" });
      const product = await createProduct(org.id, { name: "Invoice Product", sellingPrice: 150 });

      const res = await request(app)
        .post("/api/v1/invoices")
        .set("Authorization", `Bearer ${token}`)
        .send({
          customerId: customer.id,
          issueDate: new Date().toISOString(),
          items: [{ productId: product.id, quantity: 2, unitPrice: 150, discountAmount: 0 }],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.customerId).toBe(customer.id);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.subtotal).toBe(300);
    });

    it("returns 400 when customerId is missing", async () => {
      const auth = await createAuthenticatedUser(app, { email: "inv.noc@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Inv NoC Org" });
      const token = await switchAndGetToken(auth, org.id);
      const product = await createProduct(org.id, { name: "NoC Product", sellingPrice: 50 });

      const res = await request(app)
        .post("/api/v1/invoices")
        .set("Authorization", `Bearer ${token}`)
        .send({
          issueDate: new Date().toISOString(),
          items: [{ productId: product.id, quantity: 1, unitPrice: 50, discountAmount: 0 }],
        });

      expect(res.status).toBe(400);
    });

    it("returns 401 when unauthenticated", async () => {
      const res = await request(app).post("/api/v1/invoices").send({});
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/v1/invoices", () => {
    it("lists only invoices in the authenticated org", async () => {
      const authA = await createAuthenticatedUser(app, { email: "inv.list.a@example.com" });
      const orgA = await createOrganization(authA.user.id, { name: "Inv List Org A" });
      const tokenA = await switchAndGetToken(authA, orgA.id);

      const authB = await createAuthenticatedUser(app, { email: "inv.list.b@example.com" });
      const orgB = await createOrganization(authB.user.id, { name: "Inv List Org B" });

      const custA = await createCustomer(orgA.id);
      const prodA = await createProduct(orgA.id);
      const custB = await createCustomer(orgB.id);
      const prodB = await createProduct(orgB.id);

      await createInvoice(orgA.id, custA.id, prodA.id, { invoiceNumber: "INV-ORG-A" });
      await createInvoice(orgB.id, custB.id, prodB.id, { invoiceNumber: "INV-ORG-B" });

      const res = await request(app)
        .get("/api/v1/invoices")
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      const numbers = (res.body.data.items ?? res.body.data).map((i: any) => i.invoiceNumber);
      expect(numbers).toContain("INV-ORG-A");
      expect(numbers).not.toContain("INV-ORG-B");
    });
  });

  describe("GET /api/v1/invoices/:id", () => {
    it("returns an invoice by ID with items", async () => {
      const auth = await createAuthenticatedUser(app, { email: "inv.get@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Inv Get Org" });
      const token = await switchAndGetToken(auth, org.id);
      const customer = await createCustomer(org.id);
      const product = await createProduct(org.id);
      const invoice = await createInvoice(org.id, customer.id, product.id, { invoiceNumber: "INV-FIND" });

      const res = await request(app)
        .get(`/api/v1/invoices/${invoice.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.invoiceNumber).toBe("INV-FIND");
      expect(res.body.data.items).toBeDefined();
    });

    it("returns 404 for a non-existent invoice", async () => {
      const auth = await createAuthenticatedUser(app, { email: "inv.404@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Inv 404 Org" });
      const token = await switchAndGetToken(auth, org.id);

      const res = await request(app)
        .get("/api/v1/invoices/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe("Invoice status transitions", () => {
    it("marks a DRAFT invoice as ISSUED/SENT", async () => {
      const auth = await createAuthenticatedUser(app, { email: "inv.send@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Inv Send Org" });
      const token = await switchAndGetToken(auth, org.id);
      const customer = await createCustomer(org.id);
      const product = await createProduct(org.id, { sellingPrice: 100 });
      const invoice = await createInvoice(org.id, customer.id, product.id);

      const res = await request(app)
        .patch(`/api/v1/invoices/${invoice.id}/send`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(["ISSUED", "SENT"]).toContain(res.body.data.status);
    });
  });

  describe("DELETE /api/v1/invoices/:id", () => {
    it("deletes a DRAFT invoice", async () => {
      const auth = await createAuthenticatedUser(app, { email: "inv.delete@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Inv Delete Org" });
      const token = await switchAndGetToken(auth, org.id);
      const customer = await createCustomer(org.id);
      const product = await createProduct(org.id);
      const invoice = await createInvoice(org.id, customer.id, product.id);

      const del = await request(app)
        .delete(`/api/v1/invoices/${invoice.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(del.status).toBe(200);
    });
  });
});
