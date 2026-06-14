import { PrismaClient } from "@prisma/client";
import { processAccountingJob } from "../src/queue/jobs/accounting.job.js";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking for PENDING outbox events...");
  const events = await prisma.outboxEvent.findMany({
    where: { status: { in: ["PENDING", "FAILED"] } }
  });

  console.log(`Found ${events.length} pending events.`);

  for (const event of events) {
    console.log(`Processing event: ${event.eventType} (${event.id})`);
    
    // Simulate BullMQ job wrapper
    const job = { data: event } as any;
    
    try {
      await processAccountingJob(job);
      console.log(`Successfully processed event ${event.id}`);
      
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: { status: "COMPLETED" }
      });
    } catch (e) {
      console.error(`Failed to process event ${event.id}:`, e);
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: { status: "FAILED" }
      });
    }
  }

  const entries = await prisma.journalEntry.findMany({
    include: { lines: true },
    orderBy: { createdAt: "desc" },
    take: 5
  });
  
  console.log("\n--- Generated Journal Entries ---");
  console.log(JSON.stringify(entries, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
