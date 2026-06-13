import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

async function main() {
  console.log("Setting up test data...");

  // 1. Create dummy organization
  const organizationId = uuidv4();
  const userId = uuidv4();
  const ts = Date.now().toString();
  await prisma.user.create({
    data: {
      id: userId,
      email: "test-" + ts + "@example.com",
      name: "Test User",
      password: "dummy"
    }
  });

  await prisma.organization.create({
    data: {
      id: organizationId,
      name: "Test Org for Journals",
      slug: "test-journals-" + ts,
      joinCode: "JOIN" + ts,
      ownerId: userId
    }
  });

  // 2. Setup System Accounts
  const defaultAccounts = [
    { code: "1000", name: "Cash", type: "ASSET", isSystem: true, id: uuidv4() },
    { code: "1200", name: "Accounts Receivable", type: "ASSET", isSystem: true, id: uuidv4() },
    { code: "1300", name: "Inventory", type: "ASSET", isSystem: true, id: uuidv4() },
    { code: "1350", name: "GRNI", type: "LIABILITY", isSystem: true, id: uuidv4() },
    { code: "2000", name: "Accounts Payable", type: "LIABILITY", isSystem: true, id: uuidv4() },
    { code: "2100", name: "Tax Payable", type: "LIABILITY", isSystem: true, id: uuidv4() },
    { code: "4000", name: "Sales Revenue", type: "REVENUE", isSystem: true, id: uuidv4() },
    { code: "5000", name: "Cost of Goods Sold", type: "EXPENSE", isSystem: true, id: uuidv4() },
  ];

  for (const acc of defaultAccounts) {
    await prisma.account.create({
      data: {
        ...acc,
        organizationId
      }
    });
  }

  // 3. Create DefaultAccountMapping
  const existingMapping = await prisma.defaultAccountMapping.findUnique({
    where: { organizationId }
  });

  if (!existingMapping) {
    await prisma.defaultAccountMapping.create({
      data: {
        organizationId,
        arAccountId: defaultAccounts.find(a => a.name === "Accounts Receivable")!.id,
        apAccountId: defaultAccounts.find(a => a.name === "Accounts Payable")!.id,
        revenueAccountId: defaultAccounts.find(a => a.name === "Sales Revenue")!.id,
        inventoryAccountId: defaultAccounts.find(a => a.name === "Inventory")!.id,
        taxPayableAccountId: defaultAccounts.find(a => a.name === "Tax Payable")!.id,
        taxReceivableAccountId: defaultAccounts.find(a => a.name === "Tax Payable")!.id,
        cogsAccountId: defaultAccounts.find(a => a.name === "Cost of Goods Sold")!.id,
        grniAccountId: defaultAccounts.find(a => a.name === "GRNI")!.id,
      }
    });
  }

  // 4. Create an active Accounting Period
  let period = await prisma.accountingPeriod.findFirst({
    where: { organizationId, status: "OPEN" }
  });

  if (!period) {
    const activeYear = await prisma.fiscalYear.findFirst({
      where: { organizationId, isActive: true }
    });
    
    let fyId = activeYear?.id;
    if (!activeYear) {
      const fy = await prisma.fiscalYear.create({
        data: {
          organizationId,
          name: "FY2026",
          startDate: new Date("2026-01-01"),
          endDate: new Date("2026-12-31"),
          isActive: true,
          isClosed: false
        }
      });
      fyId = fy.id;
    }

    period = await prisma.accountingPeriod.create({
      data: {
        organizationId,
        fiscalYearId: fyId!,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
        status: "OPEN"
      }
    });
  }

  // 5. Fire Outbox Event: SalesInvoiceIssued
  console.log("Firing SalesInvoiceIssued OutboxEvent...");
  await prisma.outboxEvent.create({
    data: {
      organizationId,
      aggregateType: "SalesInvoice",
      aggregateId: "3fd907ea-ba30-459f-919b-8dc8933de64e",
      eventType: "SalesInvoiceIssued",
      payload: {
        invoiceId: uuidv4(),
        invoiceNumber: "INV-1001",
        customerId: uuidv4(),
        subtotal: 1000,
        taxAmount: 100,
        totalAmount: 1100,
        currency: "USD",
        cogsAmount: 650
      },
      status: "PENDING"
    }
  });

  // 6. Fire Outbox Event: VendorInvoiceApproved
  console.log("Firing VendorInvoiceApproved OutboxEvent...");
  await prisma.outboxEvent.create({
    data: {
      organizationId,
      aggregateType: "VendorInvoice",
      aggregateId: "8fd907ea-ba30-459f-919b-8dc8933de64e",
      eventType: "VendorInvoiceApproved",
      payload: {
        invoiceId: uuidv4(),
        invoiceNumber: "VINV-999",
        vendorId: uuidv4(),
        subtotal: 500,
        taxAmount: 50,
        totalAmount: 550,
        currency: "USD"
      },
      status: "PENDING"
    }
  });

  // 7. Fire Outbox Event: GoodsReceiptNoteReceived
  console.log("Firing GoodsReceiptNoteReceived OutboxEvent...");
  await prisma.outboxEvent.create({
    data: {
      organizationId,
      aggregateType: "GoodsReceiptNote",
      aggregateId: "grn-uuid-999",
      eventType: "GoodsReceiptNoteReceived",
      payload: {
        grnId: "grn-uuid-999",
        grnNumber: "GRN-100",
        totalValue: 500,
        currency: "USD",
        receivedAt: new Date().toISOString()
      },
      status: "PENDING"
    }
  });

  console.log("Events inserted. The Relay worker will pick these up automatically if running.");
  console.log("Check the JournalEntry table to see the results!");
  console.log(`Organization ID: ${organizationId}`);
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
