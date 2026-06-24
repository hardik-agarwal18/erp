import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  const customers = await prisma.customer.findMany({ where: { code: null } });
  for (const c of customers) {
    await prisma.customer.update({
      where: { id: c.id },
      data: { code: `CUS-${c.id.substring(0, 6).toUpperCase()}`, type: "CORPORATE" }
    });
  }
  console.log(`Updated ${customers.length} customers.`);
}

main().finally(() => prisma.$disconnect());
