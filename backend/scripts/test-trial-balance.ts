import { PrismaClient } from "@prisma/client";
import { TrialBalanceEngine } from "../src/domains/financials/reports/trial-balance.engine.js";
import { BalanceSheetService, PnLService } from "../src/domains/financials/reports/financial-statements.service.js";

const prisma = new PrismaClient();

async function main() {
  // Use the same organization ID from test-handlers.ts
  const organizationId = "20ca8831-2c58-4f4d-8d23-e397ee351406";

  console.log("=== TRIAL BALANCE ENGINE VERIFICATION ===\n");

  const tb = await TrialBalanceEngine.generate({ organizationId });
  
  console.log("ACCOUNT BALANCES:");
  console.table(tb.rows.map(r => ({
    "Account": r.accountName,
    "Type": r.accountType,
    "Op Debit": r.openingDebit.toString(),
    "Op Credit": r.openingCredit.toString(),
    "Mv Debit": r.movementDebit.toString(),
    "Mv Credit": r.movementCredit.toString(),
    "Cl Debit": r.closingDebit.toString(),
    "Cl Credit": r.closingCredit.toString(),
  })));

  console.log("\nTRIAL BALANCE TOTALS:");
  console.log(`Total Closing Debits:  ${tb.totalClosingDebit.toString()}`);
  console.log(`Total Closing Credits: ${tb.totalClosingCredit.toString()}`);
  console.log(`IS BALANCED: ${tb.isBalanced ? "✅ YES" : "❌ NO"}`);


  console.log("\n\n=== BALANCE SHEET VERIFICATION ===\n");
  const bs = await BalanceSheetService.generate({ organizationId });
  console.log(`Total Assets:             ${bs.totalAssets.toString()}`);
  console.log(`Total Liabilities:        ${bs.totalLiabilities.toString()}`);
  console.log(`Current Year Net Income:  ${bs.currentYearNetIncome.toString()}`);
  console.log(`Total Liab + Equity:      ${bs.totalLiabilitiesAndEquity.toString()}`);
  console.log(`IS BALANCED: ${bs.isBalanced ? "✅ YES" : "❌ NO"}`);


  console.log("\n\n=== PROFIT & LOSS VERIFICATION ===\n");
  const pnl = await PnLService.generate({ organizationId });
  console.log(`Total Revenue:    ${pnl.totalRevenue.toString()}`);
  console.log(`Total COGS:       ${pnl.totalCogs.toString()}`);
  console.log(`Gross Profit:     ${pnl.grossProfit.toString()}`);
  console.log(`Total Expenses:   ${pnl.totalExpenses.toString()}`);
  console.log(`NET INCOME:       ${pnl.netIncome.toString()}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
