import { TrialBalanceEngine, TrialBalanceParams, TrialBalanceRow } from "./trial-balance.engine.js";
import { AccountType, BalanceType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { accountMappingService } from "../accounting/mapping.service.js";

export class BalanceSheetService {
  static async generate(params: TrialBalanceParams) {
    const tb = await TrialBalanceEngine.generate(params);

    const assets: TrialBalanceRow[] = [];
    const liabilities: TrialBalanceRow[] = [];
    const equity: TrialBalanceRow[] = [];

    let totalAssets = new Decimal(0);
    let totalLiabilities = new Decimal(0);
    let totalEquity = new Decimal(0);

    // Use root rows for the hierarchical display
    for (const row of tb.rows) {
      if (row.accountType === AccountType.ASSET) {
        assets.push(row);
        totalAssets = totalAssets.plus(row.closingDebit).minus(row.closingCredit);
      } else if (row.accountType === AccountType.LIABILITY) {
        liabilities.push(row);
        totalLiabilities = totalLiabilities.plus(row.closingCredit).minus(row.closingDebit);
      } else if (row.accountType === AccountType.EQUITY) {
        equity.push(row);
        totalEquity = totalEquity.plus(row.closingCredit).minus(row.closingDebit);
      }
    }

    // Retained Earnings (Net Income of current period if not yet closed)
    let totalRevenue = new Decimal(0);
    let totalExpense = new Decimal(0);
    
    for (const row of tb.rows) {
      if (row.accountType === AccountType.REVENUE) {
        totalRevenue = totalRevenue.plus(row.closingCredit).minus(row.closingDebit);
      } else if (row.accountType === AccountType.EXPENSE) {
        totalExpense = totalExpense.plus(row.closingDebit).minus(row.closingCredit);
      }
    }

    const currentYearNetIncome = totalRevenue.minus(totalExpense);
    totalEquity = totalEquity.plus(currentYearNetIncome);

    return {
      assets,
      liabilities,
      equity,
      currentYearNetIncome,
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalLiabilitiesAndEquity: totalLiabilities.plus(totalEquity),
      isBalanced: totalAssets.equals(totalLiabilities.plus(totalEquity))
    };
  }
}

export class PnLService {
  static async generate(params: TrialBalanceParams) {
    const tb = await TrialBalanceEngine.generate(params);

    // Fetch mappings to identify COGS
    let cogsAccountId: string | null = null;
    try {
      cogsAccountId = await accountMappingService.getRequiredAccount(params.organizationId, "cogsAccountId");
    } catch (e) {
      // Ignored if not configured
    }

    const revenue: TrialBalanceRow[] = [];
    const cogs: TrialBalanceRow[] = [];
    const expenses: TrialBalanceRow[] = [];

    let totalRevenue = new Decimal(0);
    let totalCogs = new Decimal(0);
    let totalExpenses = new Decimal(0);

    for (const row of tb.rows) {
      const netMovementCredit = row.movementCredit.minus(row.movementDebit);
      const netMovementDebit = row.movementDebit.minus(row.movementCredit);

      if (row.accountType === AccountType.REVENUE) {
        revenue.push(row);
        totalRevenue = totalRevenue.plus(netMovementCredit);
      } else if (row.accountType === AccountType.EXPENSE) {
        // If it's a COGS account (or parent of COGS) we might want it in COGS section
        // For simplicity, we just put all expenses in expenses array,
        // unless it's exactly the COGS root.
        if (cogsAccountId && row.accountId === cogsAccountId) {
          cogs.push(row);
          totalCogs = totalCogs.plus(netMovementDebit);
        } else {
          // If a child of this root is COGS, it's mixed. 
          // Ideally COGS is its own root. In our seed, "Direct Expenses (COGS)" is a root!
          // We'll check if any child is COGS, or if the root itself is.
          const hasCogs = tb.flatRows.find(r => r.accountId === cogsAccountId);
          // For now, if the root has the word COGS or is the cogs account:
          if (row.accountId === cogsAccountId || row.accountName.includes("COGS")) {
            cogs.push(row);
            totalCogs = totalCogs.plus(netMovementDebit);
          } else {
            expenses.push(row);
            totalExpenses = totalExpenses.plus(netMovementDebit);
          }
        }
      }
    }

    const grossProfit = totalRevenue.minus(totalCogs);
    const netIncome = grossProfit.minus(totalExpenses);

    return {
      revenue,
      cogs,
      expenses,
      totalRevenue,
      totalCogs,
      grossProfit,
      totalExpenses,
      netIncome
    };
  }
}
