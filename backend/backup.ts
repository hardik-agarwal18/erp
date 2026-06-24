import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function backup() {
  console.log('Backing up Invoice table...');
  const invoices = await prisma.invoice.findMany();
  fs.writeFileSync('invoice_backup.json', JSON.stringify(invoices, null, 2));
  console.log(`Backed up ${invoices.length} invoices.`);
  
  // Also backup receipt table if it exists
  try {
    const receipts = (await prisma as any).receipt?.findMany ? await (prisma as any).receipt.findMany() : [];
    fs.writeFileSync('receipt_backup.json', JSON.stringify(receipts, null, 2));
  } catch(e) {}
}

backup().catch(console.error).finally(() => prisma.$disconnect());
