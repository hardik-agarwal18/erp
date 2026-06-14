import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const outboxEvents = await prisma.outboxEvent.findMany({
    where: { organizationId: "20ca8831-2c58-4f4d-8d23-e397ee351406" },
    orderBy: { createdAt: "desc" }
  });
  console.log("Outbox Events:");
  console.log(JSON.stringify(outboxEvents, null, 2));

  const entries = await prisma.journalEntry.findMany({
    where: { organizationId: "20ca8831-2c58-4f4d-8d23-e397ee351406" },
    include: { lines: true },
    orderBy: { createdAt: "desc" }
  });
  console.log("Journal Entries:");
  console.log(JSON.stringify(entries, null, 2));

  console.log(JSON.stringify(entries, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
