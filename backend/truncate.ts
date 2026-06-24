import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "GoodsReceiptNote" CASCADE;`);
}

run()
  .then(() => console.log("Truncated GoodsReceiptNote"))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
