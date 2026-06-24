import prisma from "./src/config/database.js";
import { WorkflowEntityType } from "@prisma/client";

async function seedPaymentBatchRule() {
  const org = await prisma.organization.findFirst();
  if (!org) return console.log("No org found");

  const existing = await prisma.workflowRule.findFirst({
    where: { organizationId: org.id, entityType: "PAYMENT_BATCH" }
  });

  if (!existing) {
    await prisma.workflowRule.create({
      data: {
        organizationId: org.id,
        name: "Default Payment Batch Approval",
        entityType: "PAYMENT_BATCH",
        isActive: true,
        priority: 1,
        effectiveFrom: new Date(),
        conditions: {
          field: "totalAmount",
          operator: "GT",
          value: 0
        },
        steps: [
          {
             stepIndex: 1,
             role: "FINANCE_MANAGER",
             condition: { field: "totalAmount", operator: "GT", value: 100000 }
          },
          {
             stepIndex: 2,
             role: "CFO",
             condition: { field: "totalAmount", operator: "GT", value: 1000000 }
          }
        ]
      }
    });
    console.log("Seeded default PAYMENT_BATCH workflow rule.");
  } else {
    console.log("PAYMENT_BATCH rule already exists.");
  }
}

seedPaymentBatchRule().catch(console.error).finally(() => prisma.$disconnect());
