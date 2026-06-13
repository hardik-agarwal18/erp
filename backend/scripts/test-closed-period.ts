import { PrismaClient } from "@prisma/client";
import { grnAccountingHandler } from "../src/domains/financials/accounting/handlers/grn.handler.js";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

async function main() {
  const organizationId = "20ca8831-2c58-4f4d-8d23-e397ee351406";

  // Close the accounting period for the current date
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  let period = await prisma.accountingPeriod.findUnique({
    where: {
      organizationId_month_year: {
        organizationId,
        month,
        year
      }
    }
  });

  if (!period) {
    console.error("Accounting period not found.");
    return;
  }

  await prisma.accountingPeriod.update({
    where: { id: period.id },
    data: { status: "CLOSED" }
  });

  console.log("Accounting period CLOSED.");

  const grnEvent = {
    id: uuidv4(),
    payload: {
      grnId: "grn-uuid-closed",
      currency: "USD",
      grnNumber: "GRN-CLOSED",
      receivedAt: new Date().toISOString(),
      totalValue: 500
    },
    createdAt: new Date()
  };

  try {
    console.log("Attempting to process GRN in a closed period...");
    await grnAccountingHandler.handle(organizationId, grnEvent as any);
    console.log("SUCCESS? This should not have happened.");
  } catch (error: any) {
    console.log("BLOCKED as expected:", error.message);
  }

  // Restore the period back to OPEN
  await prisma.accountingPeriod.update({
    where: { id: period.id },
    data: { status: "OPEN" }
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
