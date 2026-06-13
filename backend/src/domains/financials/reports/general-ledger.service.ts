import prisma from "../../../config/database.js";
import { BalanceType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export interface GetLedgerParams {
  organizationId: string;
  accountId: string;
  startDate?: Date;
  endDate?: Date;
}

export interface LedgerRow {
  date: Date;
  referenceId: string | null;
  description: string | null;
  debit: Decimal;
  credit: Decimal;
  balance: Decimal;
}

export const generalLedgerService = {
  getAccountLedger: async (params: GetLedgerParams) => {
    const { organizationId, accountId, startDate, endDate } = params;

    const account = await prisma.account.findUnique({
      where: { id: accountId }
    });

    if (!account || account.organizationId !== organizationId) {
      throw new Error("Account not found");
    }

    // Calculate Opening Balance
    let openingDebit = new Decimal(0);
    let openingCredit = new Decimal(0);

    if (startDate) {
      const openingLines = await prisma.journalLine.findMany({
        where: {
          accountId,
          entry: {
            isPosted: true,
            postedAt: {
              lt: startDate
            }
          }
        }
      });

      for (const line of openingLines) {
        openingDebit = openingDebit.plus(line.debit);
        openingCredit = openingCredit.plus(line.credit);
      }
    }

    const initialBalance = account.normalBalance === BalanceType.DEBIT 
      ? openingDebit.minus(openingCredit)
      : openingCredit.minus(openingDebit);

    // Fetch lines in range
    const lines = await prisma.journalLine.findMany({
      where: {
        accountId,
        entry: {
          isPosted: true,
          ...(startDate || endDate ? {
            postedAt: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {})
            }
          } : {})
        }
      },
      include: {
        entry: true
      },
      orderBy: {
        entry: {
          postedAt: 'asc'
        }
      }
    });

    const rows: LedgerRow[] = [];
    let runningBalance = initialBalance;

    for (const line of lines) {
      if (account.normalBalance === BalanceType.DEBIT) {
        runningBalance = runningBalance.plus(line.debit).minus(line.credit);
      } else {
        runningBalance = runningBalance.plus(line.credit).minus(line.debit);
      }

      rows.push({
        date: line.entry.postedAt || line.entry.createdAt,
        referenceId: line.entry.referenceId,
        description: line.description || line.entry.description,
        debit: line.debit,
        credit: line.credit,
        balance: runningBalance
      });
    }

    return {
      accountId: account.id,
      accountCode: account.code,
      accountName: account.name,
      normalBalance: account.normalBalance,
      openingBalance: initialBalance,
      closingBalance: runningBalance,
      rows
    };
  }
};

