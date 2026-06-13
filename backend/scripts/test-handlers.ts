import { PrismaClient } from "@prisma/client";
import { invoiceAccountingHandler } from "../src/domains/financials/accounting/handlers/invoice.handler.js";
import { vendorInvoiceAccountingHandler } from "../src/domains/financials/accounting/handlers/vendor-invoice.handler.js";
import { grnAccountingHandler } from "../src/domains/financials/accounting/handlers/grn.handler.js";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

async function main() {
  const organizationId = "20ca8831-2c58-4f4d-8d23-e397ee351406";
  
  // 1. Test GRN Handler
  const grnEvent = {
    id: uuidv4(),
    payload: {
      grnId: "grn-uuid-999",
      currency: "USD",
      grnNumber: "GRN-100",
      receivedAt: new Date().toISOString(),
      totalValue: 500
    },
    createdAt: new Date()
  };
  
  console.log("Running GRN Handler...");
  await grnAccountingHandler.handle(organizationId, grnEvent as any);
  console.log("GRN Handler complete.");

  // 2. Test Vendor Invoice Handler
  const viEvent = {
    id: uuidv4(),
    payload: {
      currency: "USD",
      subtotal: 500,
      vendorId: uuidv4(),
      invoiceId: uuidv4(),
      taxAmount: 50,
      totalAmount: 550,
      invoiceNumber: "VINV-999"
    },
    createdAt: new Date()
  };

  console.log("Running Vendor Invoice Handler...");
  await vendorInvoiceAccountingHandler.handle(organizationId, viEvent as any);
  console.log("Vendor Invoice Handler complete.");

  // 3. Test Sales Invoice Handler
  const siEvent = {
    id: uuidv4(),
    payload: {
      currency: "USD",
      subtotal: 1000,
      invoiceId: uuidv4(),
      taxAmount: 100,
      cogsAmount: 650,
      customerId: uuidv4(),
      totalAmount: 1100,
      invoiceNumber: "INV-1001"
    },
    createdAt: new Date()
  };

  console.log("Running Sales Invoice Handler...");
  await invoiceAccountingHandler.handle(organizationId, siEvent as any);
  console.log("Sales Invoice Handler complete.");

  const entries = await prisma.journalEntry.findMany({
    where: { organizationId },
    include: { lines: true },
    orderBy: { createdAt: "desc" }
  });

  console.log("\n--- Generated Journal Entries ---");
  console.log(JSON.stringify(entries, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
