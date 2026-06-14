import { PrismaClient } from '@prisma/client';
import { accountingService } from './src/domains/financials/accounting/accounting.service.js';

const prisma = new PrismaClient();

async function main() {
  const orgId = 'c0b56c06-ba12-481d-bbb9-aec278047138';
  
  console.log('Seeding accounts...');
  await accountingService.seedDefaultAccounts(orgId);
  console.log('Seeding fiscal year...');
  await accountingService.seedFiscalYear(orgId);

  const exp = await prisma.expense.findFirst({ where: { amount: 3000 } });
  if (exp) {
    console.log('Posting expense to GL...');
    await accountingService.postExpenseJournal(
      exp.organizationId,
      exp.id,
      exp.description || 'Expense: ' + exp.category,
      Number(exp.amount),
      exp.category
    );
    console.log('Expense posted successfully!');
  }
}

main().catch(console.error).finally(() => process.exit(0));
