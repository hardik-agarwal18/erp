import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const entries = await prisma.journalEntry.findMany({
    include: { lines: true },
    orderBy: { createdAt: "desc" },
    take: 5
  });
  console.log(JSON.stringify(entries, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
