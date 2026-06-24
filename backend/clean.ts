import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clean() {
  console.log('Deleting existing invoices to allow enum migration...');
  await prisma.$executeRawUnsafe(`DELETE FROM "Invoice"`);
  console.log('Invoices deleted.');
}

clean().catch(console.error).finally(() => prisma.$disconnect());
