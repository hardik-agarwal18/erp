import request from "supertest";

import app from "../../../src/app.js";
import { createAuthenticatedUser } from "../../helpers/auth.helper.js";
import { createOrganization } from "../../helpers/organization.helper.js";
import { prisma } from "../../setup/testDb.js";

describe("accounting core flow", () => {
  it("creates an issued invoice with tax, inventory movement, and transaction", async () => {
    const auth = await createAuthenticatedUser(app, {
      email: "invoice.owner@example.com",
    });
    const organization = await createOrganization(auth.user.id);

    const customerResponse = await request(app)
      .post("/api/v1/customers")
      .set("Authorization", `Bearer ${auth.accessToken}`)
      .set("x-organization-id", organization.id)
      .send({ name: "Acme Customer", email: "billing@acme.com" });

    const taxResponse = await request(app)
      .post("/api/v1/taxes")
      .set("Authorization", `Bearer ${auth.accessToken}`)
      .set("x-organization-id", organization.id)
      .send({ name: "GST 18%", rate: 18, type: "GST", isDefault: true });

    const productResponse = await request(app)
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${auth.accessToken}`)
      .set("x-organization-id", organization.id)
      .send({
        name: "Widget",
        sku: "W-100",
        sellingPrice: 100,
        purchasePrice: 60,
        type: "PHYSICAL",
        taxId: taxResponse.body.data.id,
      });

    await request(app)
      .post("/api/v1/inventory/adjustments")
      .set("Authorization", `Bearer ${auth.accessToken}`)
      .set("x-organization-id", organization.id)
      .send({ productId: productResponse.body.data.id, quantity: 10 });

    const invoiceResponse = await request(app)
      .post("/api/v1/invoices")
      .set("Authorization", `Bearer ${auth.accessToken}`)
      .set("x-organization-id", organization.id)
      .send({
        customerId: customerResponse.body.data.id,
        issueDate: new Date().toISOString(),
        status: "ISSUED",
        items: [
          {
            productId: productResponse.body.data.id,
            quantity: 2,
          },
        ],
      });

    const invoice = invoiceResponse.body.data;
    const inventoryItem = await prisma.inventoryItem.findFirstOrThrow({
      where: {
        organizationId: organization.id,
        productId: productResponse.body.data.id,
      },
    });
    const movement = await prisma.inventoryMovement.findFirst({
      where: { organizationId: organization.id, referenceId: invoice.id },
    });
    const transaction = await prisma.transaction.findFirst({
      where: { organizationId: organization.id, referenceId: invoice.id },
    });

    expect(invoiceResponse.status).toBe(201);
    expect(invoice.status).toBe("ISSUED");
    expect(Number(invoice.taxAmount)).toBeCloseTo(36);
    expect(Number(inventoryItem.quantity)).toBe(8);
    expect(movement).toBeTruthy();
    expect(transaction).toBeTruthy();
  });

  it("allocates payments and updates invoice status", async () => {
    const auth = await createAuthenticatedUser(app, {
      email: "payment.owner@example.com",
    });
    const organization = await createOrganization(auth.user.id);

    const customer = await request(app)
      .post("/api/v1/customers")
      .set("Authorization", `Bearer ${auth.accessToken}`)
      .set("x-organization-id", organization.id)
      .send({ name: "Billing Customer" });

    const product = await request(app)
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${auth.accessToken}`)
      .set("x-organization-id", organization.id)
      .send({
        name: "Service Plan",
        sellingPrice: 200,
        type: "SERVICE",
      });

    const invoiceResponse = await request(app)
      .post("/api/v1/invoices")
      .set("Authorization", `Bearer ${auth.accessToken}`)
      .set("x-organization-id", organization.id)
      .send({
        customerId: customer.body.data.id,
        issueDate: new Date().toISOString(),
        status: "ISSUED",
        items: [
          {
            productId: product.body.data.id,
            quantity: 1,
          },
        ],
      });

    await request(app)
      .post("/api/v1/payments")
      .set("Authorization", `Bearer ${auth.accessToken}`)
      .set("x-organization-id", organization.id)
      .send({
        invoiceId: invoiceResponse.body.data.id,
        amount: 80,
        paymentMethod: "CASH",
        paymentDate: new Date().toISOString(),
      });

    const updatedInvoice = await prisma.invoice.findUniqueOrThrow({
      where: { id: invoiceResponse.body.data.id },
    });

    await request(app)
      .post("/api/v1/payments")
      .set("Authorization", `Bearer ${auth.accessToken}`)
      .set("x-organization-id", organization.id)
      .send({
        invoiceId: invoiceResponse.body.data.id,
        amount: 120,
        paymentMethod: "BANK_TRANSFER",
        paymentDate: new Date().toISOString(),
      });

    const paidInvoice = await prisma.invoice.findUniqueOrThrow({
      where: { id: invoiceResponse.body.data.id },
    });

    expect(updatedInvoice.status).toBe("PARTIALLY_PAID");
    expect(paidInvoice.status).toBe("PAID");
  });

  it("generates reports and enforces tenant isolation", async () => {
    const auth = await createAuthenticatedUser(app, {
      email: "report.owner@example.com",
    });
    const organization = await createOrganization(auth.user.id);
    const otherOrg = await createOrganization(auth.user.id, {
      name: "Other Org",
    });

    await request(app)
      .post("/api/v1/customers")
      .set("Authorization", `Bearer ${auth.accessToken}`)
      .set("x-organization-id", organization.id)
      .send({ name: "Primary Customer" });

    const listResponse = await request(app)
      .get("/api/v1/customers")
      .set("Authorization", `Bearer ${auth.accessToken}`)
      .set("x-organization-id", otherOrg.id);

    const reportResponse = await request(app)
      .get("/api/v1/reports/sales")
      .set("Authorization", `Bearer ${auth.accessToken}`)
      .set("x-organization-id", organization.id);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data.items.length).toBe(0);
    expect(reportResponse.status).toBe(200);
    expect(reportResponse.body.data).toHaveProperty("totalSales");
  });
});
