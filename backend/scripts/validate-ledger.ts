import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function validateLedger() {
  console.log("Starting Ledger Validation...");

  // 1. Fetch all processed accounting outbox events
  const outboxEvents = await prisma.outboxEvent.findMany({
    where: {
      type: {
        in: [
          "SalesInvoicePOSTED",
          "VendorInvoicePosted",
          "VendorPaymentCreated",
          "GoodsReceiptNoteReceived",
          "PayrollApproved"
        ]
      },
      status: "COMPLETED"
    }
  });

  console.log(`Found ${outboxEvents.length} completed financial events.`);

  let missingEntries = 0;

  for (const event of outboxEvents) {
    // 2. Look for the corresponding Journal Entry
    // The idempotency key or referenceId is usually mapped to the eventId
    const journal = await prisma.journalEntry.findFirst({
      where: {
        referenceId: event.id
      }
    });

    if (!journal) {
      console.error(`❌ MISSING JOURNAL: Event ${event.id} (${event.type}) has no corresponding Journal Entry.`);
      missingEntries++;
    }
  }

  if (missingEntries > 0) {
    console.error(`\nValidation Failed: ${missingEntries} missing Journal Entries detected.`);
    console.log("Recommendation: Run dlq-replay or surgically re-emit these Outbox events.");
    process.exit(1);
  }

  console.log("\n✅ Validation Passed: The Ledger is mathematically contiguous with the Outbox.");
  process.exit(0);
}

validateLedger().catch(console.error);
