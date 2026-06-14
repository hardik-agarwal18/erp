import prisma from "../../../config/database.js";
import { AccountType, BalanceType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export interface TrialBalanceParams {
  organizationId: string;
  startDate?: Date;
  endDate?: Date;
  fiscalYearId?: string;
}

export interface TrialBalanceRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  normalBalance: BalanceType;
  parentId: string | null;
  openingDebit: Decimal;
  openingCredit: Decimal;
  movementDebit: Decimal;
  movementCredit: Decimal;
  closingDebit: Decimal;
  closingCredit: Decimal;
  children?: TrialBalanceRow[];
}

export interface TrialBalanceResult {
  rows: TrialBalanceRow[]; // Hierarchical top-level rows
  flatRows: TrialBalanceRow[]; // All rows flat (for easy iteration if needed)
  totalOpeningDebit: Decimal;
  totalOpeningCredit: Decimal;
  totalMovementDebit: Decimal;
  totalMovementCredit: Decimal;
  totalClosingDebit: Decimal;
  totalClosingCredit: Decimal;
  isBalanced: boolean;
}

export class TrialBalanceEngine {
  static async generate(params: TrialBalanceParams): Promise<TrialBalanceResult> {
    const { organizationId, startDate, endDate, fiscalYearId } = params;

    const accounts = await prisma.account.findMany({
      where: { organizationId, isActive: true },
      orderBy: { code: 'asc' }
    });

    const accountMap = new Map<string, TrialBalanceRow>();
    
    for (const account of accounts) {
      accountMap.set(account.id, {
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name,
        accountType: account.type,
        normalBalance: account.normalBalance,
        parentId: account.parentId,
        openingDebit: new Decimal(0),
        openingCredit: new Decimal(0),
        movementDebit: new Decimal(0),
        movementCredit: new Decimal(0),
        closingDebit: new Decimal(0),
        closingCredit: new Decimal(0),
        children: []
      });
    }

    const baseWhere: any = { organizationId, isPosted: true };
    if (fiscalYearId) {
       const fiscalYear = await prisma.fiscalYear.findUnique({ where: { id: fiscalYearId } });
       if (fiscalYear) {
           if (!startDate) baseWhere.postedAt = { gte: fiscalYear.startDate };
           if (!endDate) baseWhere.postedAt = { ...baseWhere.postedAt, lte: fiscalYear.endDate };
       }
    }
    if (startDate || endDate) {
      baseWhere.postedAt = {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate })
      };
    }

    let openingWhere: any = null;
    if (startDate || (baseWhere.postedAt && baseWhere.postedAt.gte)) {
       const start = startDate || baseWhere.postedAt.gte;
       openingWhere = { organizationId, isPosted: true, postedAt: { lt: start } };
    }

    const movementLines = await prisma.journalLine.groupBy({
      by: ['accountId'],
      where: { entry: baseWhere },
      _sum: { debit: true, credit: true }
    });

    let openingLines: any[] = [];
    if (openingWhere) {
      openingLines = await prisma.journalLine.groupBy({
        by: ['accountId'],
        where: { entry: openingWhere },
        _sum: { debit: true, credit: true }
      });
    }

    for (const line of openingLines) {
      const row = accountMap.get((line as any).accountId);
      if (row) {
        row.openingDebit = new Decimal((line as any)._sum.debit || 0);
        row.openingCredit = new Decimal((line as any)._sum.credit || 0);
      }
    }

    for (const line of movementLines) {
      const row = accountMap.get((line as any).accountId);
      if (row) {
        row.movementDebit = new Decimal((line as any)._sum.debit || 0);
        row.movementCredit = new Decimal((line as any)._sum.credit || 0);
      }
    }

    // Process hierarchy rollup bottom-up
    // We do this by iterating the map. However, we need a post-order traversal to roll up correctly.
    // Instead of complex traversal, we can map parents and bubble up.
    
    // First, connect children
    const roots: TrialBalanceRow[] = [];
    for (const row of Array.from(accountMap.values())) {
      if (row.parentId) {
        const parent = accountMap.get(row.parentId);
        if (parent) {
          parent.children!.push(row);
        } else {
          roots.push(row);
        }
      } else {
        roots.push(row);
      }
    }

    // Roll up function
    const rollup = (row: TrialBalanceRow) => {
      for (const child of row.children!) {
        rollup(child);
        row.openingDebit = row.openingDebit.plus(child.openingDebit);
        row.openingCredit = row.openingCredit.plus(child.openingCredit);
        row.movementDebit = row.movementDebit.plus(child.movementDebit);
        row.movementCredit = row.movementCredit.plus(child.movementCredit);
      }
    };

    // Roll up all roots
    for (const root of roots) {
      rollup(root);
    }

    // Calculate Closing Balances & Totals on ALL nodes
    let totalOpeningDebit = new Decimal(0);
    let totalOpeningCredit = new Decimal(0);
    let totalMovementDebit = new Decimal(0);
    let totalMovementCredit = new Decimal(0);
    let totalClosingDebit = new Decimal(0);
    let totalClosingCredit = new Decimal(0);

    const flatRows = Array.from(accountMap.values());

    for (const row of flatRows) {
      const netOpening = row.openingDebit.minus(row.openingCredit);
      if (netOpening.greaterThan(0)) {
         row.openingDebit = netOpening;
         row.openingCredit = new Decimal(0);
      } else {
         row.openingCredit = netOpening.abs();
         row.openingDebit = new Decimal(0);
      }

      const totalDebit = row.openingDebit.plus(row.movementDebit);
      const totalCredit = row.openingCredit.plus(row.movementCredit);
      const netClosing = totalDebit.minus(totalCredit);

      if (netClosing.greaterThan(0)) {
         row.closingDebit = netClosing;
         row.closingCredit = new Decimal(0);
      } else {
         row.closingCredit = netClosing.abs();
         row.closingDebit = new Decimal(0);
      }

      // We only sum up roots for the grand totals to avoid double counting!
      if (!row.parentId) {
        totalOpeningDebit = totalOpeningDebit.plus(row.openingDebit);
        totalOpeningCredit = totalOpeningCredit.plus(row.openingCredit);
        totalMovementDebit = totalMovementDebit.plus(row.movementDebit);
        totalMovementCredit = totalMovementCredit.plus(row.movementCredit);
        totalClosingDebit = totalClosingDebit.plus(row.closingDebit);
        totalClosingCredit = totalClosingCredit.plus(row.closingCredit);
      }
    }

    const filterActive = (rowsToFilter: TrialBalanceRow[]): TrialBalanceRow[] => {
      const active: TrialBalanceRow[] = [];
      for (const r of rowsToFilter) {
        r.children = filterActive(r.children!);
        if (
           !r.closingDebit.isZero() || 
           !r.closingCredit.isZero() || 
           !r.movementDebit.isZero() || 
           !r.movementCredit.isZero() ||
           r.children.length > 0
        ) {
          active.push(r);
        }
      }
      return active;
    };

    const activeRoots = filterActive(roots);

    return {
      rows: activeRoots,
      flatRows: flatRows.filter(r => !r.closingDebit.isZero() || !r.closingCredit.isZero() || !r.movementDebit.isZero() || !r.movementCredit.isZero() || r.children!.length > 0),
      totalOpeningDebit,
      totalOpeningCredit,
      totalMovementDebit,
      totalMovementCredit,
      totalClosingDebit,
      totalClosingCredit,
      isBalanced: totalClosingDebit.equals(totalClosingCredit) && totalMovementDebit.equals(totalMovementCredit)
    };
  }
}

