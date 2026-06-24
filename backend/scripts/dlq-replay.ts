import { PrismaClient } from "@prisma/client";
import { eventBus } from "../src/queue/worker.service.js"; // Assume eventBus exports a utility to manually requeue

const prisma = new PrismaClient();

async function replayDlq() {
  console.log("Starting DLQ Replay...");

  const failedEvents = await prisma.outboxEvent.findMany({
    where: { status: "FAILED" },
    take: 100 // Batch limit
  });

  if (failedEvents.length === 0) {
    console.log("No failed events in the DLQ.");
    process.exit(0);
  }

  console.log(`Found ${failedEvents.length} failed events. Requeuing...`);

  let successCount = 0;
  for (const event of failedEvents) {
    try {
      // Revert status to PENDING
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: { status: "PENDING", attempts: 0 }
      });
      // Optionally re-emit to the queue manually or let the outbox processor pick it up
      successCount++;
    } catch (e) {
      console.error(`Failed to requeue event ${event.id}:`, e);
    }
  }

  console.log(`Successfully requeued ${successCount}/${failedEvents.length} events.`);
  process.exit(0);
}

replayDlq().catch(console.error);
