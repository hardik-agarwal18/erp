import { dashboardRepository } from "./dashboard.repository.js";
import { TreasuryDashboardSummary } from "../treasury.types.js";
import { prisma } from "../../../../config/database.js";

export const dashboardService = {
  getTreasuryDashboard: async (organizationId: string): Promise<TreasuryDashboardSummary> => {
    const { accounts, journalLines } = await dashboardRepository.getTreasuryDashboard(organizationId);

    // Group accounts by type and calculate balances
    const balancesByType: Record<string, { accountId: string; name: string; balance: number }[]> = {
      BANK: [],
      CASH: [],
      PETTY_CASH: [],
      WALLET: [],
      CREDIT_CARD: [],
      LOAN: [],
      DEPOSIT: [],
    };

    let totalBank = 0;
    let totalCash = 0;
    let totalWallet = 0;
    let totalCreditCard = 0;

    for (const account of accounts) {
      const jl = journalLines.find(j => j.accountId === account.linkedAccountId);
      let balance = 0;
      if (jl) {
        // Bank Accounts are ASSET, so normal balance is DEBIT.
        // If it's a CREDIT_CARD or LOAN, it's a LIABILITY, normal balance is CREDIT.
        if (account.type === "CREDIT_CARD" || account.type === "LOAN") {
          balance = Number(jl._sum.credit || 0) - Number(jl._sum.debit || 0);
        } else {
          balance = Number(jl._sum.debit || 0) - Number(jl._sum.credit || 0);
        }
      }

      balancesByType[account.type].push({
        accountId: account.id,
        name: account.name,
        balance,
      });

      if (account.type === "BANK") totalBank += balance;
      if (account.type === "CASH" || account.type === "PETTY_CASH") totalCash += balance;
      if (account.type === "WALLET") totalWallet += balance;
      if (account.type === "CREDIT_CARD") totalCreditCard += balance; // Note: For credit card, positive balance might mean debt depending on signage. Let's assume positive means cash available or credit outstanding. We should be careful.
    }

    const availableLiquidity = totalBank + totalCash + totalWallet;
    const netTreasuryPosition = availableLiquidity - totalCreditCard;

    const recentTransfers = await dashboardRepository.getRecentTransfers(organizationId);

    return {
      totalBank,
      totalCash,
      totalWallet,
      totalCreditCard,
      availableLiquidity,
      netTreasuryPosition,
      balancesByType,
      recentTransfers,
    };
  },

  getTreasuryAlerts: async (organizationId: string) => {
    const alerts: any[] = [];
    const now = new Date();

    // 1. Overdue Advances
    const overdueAdvances = await prisma.advance.count({
      where: {
        organizationId,
        status: { in: ["ISSUED", "PARTIALLY_SETTLED"] },
        dueDate: { lt: now }
      } as any
    });

    if (overdueAdvances > 0) {
      alerts.push({
        type: "OVERDUE_ADVANCES",
        severity: "warning",
        count: overdueAdvances,
        link: "/treasury/advances?tab=overdue"
      });
    }

    // 2. Frozen Accounts
    const frozenAccounts = await prisma.bankAccount.count({
      where: {
        organizationId,
        isFrozen: true,
        closedAt: null
      }
    });

    if (frozenAccounts > 0) {
      alerts.push({
        type: "FROZEN_ACCOUNTS",
        severity: "critical",
        count: frozenAccounts,
        link: "/treasury/accounts?filter=frozen"
      });
    }

    // 3. Pending Cash Variances (Unresolved Shortages/Overages - for now just count all pending counts if any)
    const pendingCounts = await (prisma as any).cashCount.count({
      where: {
        organizationId,
        status: "DRAFT"
      }
    });

    if (pendingCounts > 0) {
      alerts.push({
        type: "PENDING_CASH_COUNTS",
        severity: "info",
        count: pendingCounts,
        link: "/treasury/cash?tab=counts"
      });
    }

    // 4. High Value Write-offs (example logic: write-offs > 10000 this month)
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const highValueWriteOffs = await (prisma as any).advanceSettlement.count({
      where: {
        advance: { organizationId },
        type: "WRITE_OFF",
        amount: { gt: 10000 },
        settlementDate: { gte: currentMonthStart },
        reversedAt: null
      }
    });

    if (highValueWriteOffs > 0) {
      alerts.push({
        type: "HIGH_VALUE_WRITEOFFS",
        severity: "warning",
        count: highValueWriteOffs,
        link: "/treasury/advances?tab=settlements"
      });
    }

    return alerts;
  },

  getTreasuryActivity: async (organizationId: string, limit = 50) => {
    // For a real feed, we might use the event-bus outbox or aggregate across tables.
    // Here we query recent advances, settlements, transfers, and cash counts.
    
    const [transfers, advances, settlements, counts] = await Promise.all([
      (prisma as any).treasuryTransfer.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: { fromAccount: true, toAccount: true }
      }),
      (prisma as any).advance.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        take: limit
      }),
      (prisma as any).advanceSettlement.findMany({
        where: { advance: { organizationId } },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: { advance: true }
      }),
      (prisma as any).cashCount.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: { bankAccount: true }
      })
    ]);

    const activities: any[] = [];

    for (const t of transfers) {
      activities.push({
        id: `tx-${t.id}`,
        type: "TRANSFER",
        date: t.createdAt,
        title: `Transfer ${t.status === "POSTED" ? "Posted" : "Initiated"}`,
        description: `Transferred ${t.amount} from ${t.fromAccount?.name} to ${t.toAccount?.name}`,
        reference: t.transferSequence
      });
    }

    for (const a of advances) {
      activities.push({
        id: `adv-${a.id}`,
        type: "ADVANCE_CREATED",
        date: a.createdAt,
        title: `Advance Created`,
        description: `Advance ${a.advanceNumber} created for ${a.amount}`,
        reference: a.advanceNumber
      });
      if (a.issueDate) {
        activities.push({
          id: `adv-iss-${a.id}`,
          type: "ADVANCE_ISSUED",
          date: a.issueDate,
          title: `Advance Issued`,
          description: `Advance ${a.advanceNumber} issued for ${a.amount}`,
          reference: a.advanceNumber
        });
      }
    }

    for (const s of settlements) {
      activities.push({
        id: `set-${s.id}`,
        type: "SETTLEMENT_POSTED",
        date: s.createdAt,
        title: `Settlement Posted`,
        description: `Settlement ${s.settlementNumber} for ${s.amount} applied to Advance ${s.advance.advanceNumber}`,
        reference: s.settlementNumber
      });
    }

    for (const c of counts) {
      activities.push({
        id: `cnt-${c.id}`,
        type: "CASH_COUNT",
        date: c.createdAt,
        title: `Cash Count ${c.status === "POSTED" ? "Completed" : "Initiated"}`,
        description: `Count for ${c.bankAccount.name}. Variance: ${c.varianceAmount}`,
        reference: c.countNumber
      });
    }

    activities.sort((a, b) => b.date.getTime() - a.date.getTime());
    return activities.slice(0, limit);
  }
};
