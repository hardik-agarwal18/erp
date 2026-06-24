/**
 * reconcile-invoices.ts
 *
 * PURPOSE:
 *   Identifies sales invoices in POSTED status that are missing a corresponding
 *   JournalEntry in the General Ledger. Produces a reconciliation report and
 *   optionally re-queues outbox events for safe, idempotent backfill.
 *
 * USAGE:
 *   npx ts-node --esm scripts/reconcile-invoices.ts             # report only (safe)
 *   npx ts-node --esm scripts/reconcile-invoices.ts --requeue   # report + requeue missing
 *
 * SAFETY:
 *   - Read-only by default. Pass --requeue to trigger outbox re-processing.
 *   - Re-queuing is idempotent: BullMQ deduplicates via jobId `outbox-{eventId}`.
 *   - The accounting worker deduplicates via `outboxEvent.status === COMPLETED` check.
 *   - If sourceEventId unique constraint is active on JournalEntry, the DB prevents duplicates.
 *
 * QUERY LOGIC:
 *   Affected invoices = POSTED invoices
 *   MINUS invoices whose ID appears in JournalEntry.referenceId WHERE referenceType = "SalesInvoice"
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const REQUEUE = process.argv.includes("--requeue");

interface ReconciliationRow {
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  organizationId: string;
  postingDate: Date;
  totalAmount: number;
  outboxEventId: string | null;
  outboxEventStatus: string | null;
  journalExists: boolean;
}

async function main() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Sales Invoice ↔ General Ledger Reconciliation Report");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Mode: ${REQUEUE ? "REPORT + REQUEUE" : "REPORT ONLY (dry-run)"}`);
  console.log(`  Run at: ${new Date().toISOString()}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Step 1: Fetch all POSTED invoices
  const postedInvoices = await (prisma as any).invoice.findMany({
    where: {
      status: "POSTED",
      deletedAt: null,
    },
    select: {
      id: true,
      invoiceNumber: true,
      customerId: true,
      organizationId: true,
      issueDate: true,
      totalAmount: true,
    },
    orderBy: { issueDate: "asc" },
  });

  console.log(`Total POSTED invoices found: ${postedInvoices.length}`);

  if (postedInvoices.length === 0) {
    console.log("Nothing to reconcile.");
    await prisma.$disconnect();
    return;
  }

  const invoiceIds = postedInvoices.map((inv: any) => inv.id);

  // Step 2: Find which invoices already have a JournalEntry
  const journalEntries = await (prisma as any).journalEntry.findMany({
    where: {
      referenceId: { in: invoiceIds },
      referenceType: "SalesInvoice",
    },
    select: { referenceId: true },
  });

  const journaledInvoiceIds = new Set<string>(
    journalEntries.map((je: any) => je.referenceId)
  );

  // Step 3: Find outbox events for affected invoices
  const outboxEvents = await (prisma as any).outboxEvent.findMany({
    where: {
      aggregateId: { in: invoiceIds },
      aggregateType: "SalesInvoice",
      eventType: "SalesInvoicePOSTED",
    },
    select: {
      id: true,
      aggregateId: true,
      status: true,
    },
  });

  const outboxByInvoiceId = new Map<string, { id: string; status: string }>(
    outboxEvents.map((e: any) => [e.aggregateId, { id: e.id, status: e.status }])
  );

  // Step 4: Build reconciliation rows
  const rows: ReconciliationRow[] = postedInvoices.map((inv: any) => {
    const outbox = outboxByInvoiceId.get(inv.id);
    return {
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customerId: inv.customerId,
      organizationId: inv.organizationId,
      postingDate: inv.issueDate,
      totalAmount: Number(inv.totalAmount),
      outboxEventId: outbox?.id ?? null,
      outboxEventStatus: outbox?.status ?? null,
      journalExists: journaledInvoiceIds.has(inv.id),
    };
  });

  const missing = rows.filter((r) => !r.journalExists);
  const covered = rows.filter((r) => r.journalExists);

  // Step 5: Print report
  console.log(`\n✅  Invoices with journal entry:   ${covered.length}`);
  console.log(`❌  Invoices WITHOUT journal entry: ${missing.length}`);

  if (missing.length > 0) {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  MISSING JOURNAL ENTRIES — Detail");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Group by organization for clarity
    const byOrg = new Map<string, ReconciliationRow[]>();
    for (const row of missing) {
      const list = byOrg.get(row.organizationId) ?? [];
      list.push(row);
      byOrg.set(row.organizationId, list);
    }

    let totalMissingRevenue = 0;

    for (const [orgId, orgRows] of byOrg.entries()) {
      const orgTotal = orgRows.reduce((s, r) => s + r.totalAmount, 0);
      totalMissingRevenue += orgTotal;

      console.log(`\n  Organization: ${orgId}`);
      console.log(
        `  ${"InvoiceNumber".padEnd(20)} ${"PostingDate".padEnd(14)} ${"TotalAmount".padEnd(14)} ${"OutboxEvent".padEnd(40)} OutboxStatus`
      );
      console.log("  " + "─".repeat(110));

      for (const row of orgRows) {
        const date = row.postingDate.toISOString().split("T")[0];
        const amt = row.totalAmount.toFixed(2).padEnd(14);
        const outbox = (row.outboxEventId ?? "NO_OUTBOX_EVENT").padEnd(40);
        const status = row.outboxEventStatus ?? "—";
        console.log(`  ${row.invoiceNumber.padEnd(20)} ${date.padEnd(14)} ${amt} ${outbox} ${status}`);
      }

      console.log(`\n  Subtotal missing revenue: ${orgTotal.toFixed(2)}`);
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`  TOTAL UNRECOGNISED REVENUE: ${totalMissingRevenue.toFixed(2)}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  }

  // Step 6: Optionally requeue only the missing ones
  if (REQUEUE && missing.length > 0) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  REQUEUE MODE — resetting outbox events to PENDING");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    let requeued = 0;
    let noOutbox = 0;

    for (const row of missing) {
      if (!row.outboxEventId) {
        console.warn(
          `  ⚠️  ${row.invoiceNumber} — NO OutboxEvent found. Cannot requeue automatically. Manual intervention required.`
        );
        noOutbox++;
        continue;
      }

      // Reset to PENDING so the outbox relay picks it up on its next poll.
      // The accounting worker deduplicates via status === COMPLETED check and
      // the JournalEntry unique constraint, making this safe to requeue.
      await (prisma as any).outboxEvent.update({
        where: { id: row.outboxEventId },
        data: {
          status: "PENDING",
          retryCount: 0,
          nextRetryAt: null,
          lastError: null,
          processedAt: null,
        },
      });

      console.log(`  ✅ Reset to PENDING: ${row.invoiceNumber} (outbox: ${row.outboxEventId})`);
      requeued++;
    }

    console.log(`\n  Summary:`);
    console.log(`    Reset to PENDING:           ${requeued}`);
    console.log(`    No outbox event (manual):   ${noOutbox}`);
    console.log(`\n  Next: wait for the outbox relay worker to process the PENDING events.`);
    console.log(`  Then re-run this script WITHOUT --requeue to verify all journals are created.`);
  } else if (!REQUEUE && missing.length > 0) {
    console.log("  Run with --requeue to reset missing outbox events to PENDING for reprocessing.");
    console.log("  Example: npx ts-node --esm scripts/reconcile-invoices.ts --requeue\n");
  }

  if (missing.length === 0) {
    console.log("\n✅ RECONCILIATION PASSED: All POSTED invoices have corresponding GL journal entries.\n");
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Reconciliation script failed:", e);
  prisma.$disconnect();
  process.exit(1);
});
