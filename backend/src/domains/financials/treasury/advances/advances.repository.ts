import { Prisma } from "@prisma/client";
import { prisma } from "../../../../config/database.js";
const p: any = prisma;
import { numberSeriesService } from "../../../../infrastructure/number-series/number-series.service.js";

export const advancesRepository = {
  getNextAdvanceNumber: async (organizationId: string): Promise<string> => {
    return numberSeriesService.generateNextNumber(organizationId, "ADVANCE", "ADV");
  },

  getNextSettlementNumber: async (organizationId: string): Promise<string> => {
    return numberSeriesService.generateNextNumber(organizationId, "ADVANCE_SETTLEMENT", "SET");
  },

  createAdvance: async (organizationId: string, advanceNumber: string, data: any) => {
    return p.advance.create({
      data: {
        organizationId,
        advanceNumber,
        type: data.type,
        employeeId: data.employeeId,
        vendorId: data.vendorId,
        customerId: data.customerId,
        amount: new Prisma.Decimal(data.amount.toString()),
        outstandingAmount: new Prisma.Decimal(data.amount.toString()),
        status: "DRAFT",
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        notes: data.notes,
        issuedFromAccountId: data.issuedFromAccountId,
      },
      include: {
        employee: true,
        vendor: true,
        customer: true,
      },
    });
  },

  getAdvanceById: async (organizationId: string, id: string) => {
    return p.advance.findUnique({
      where: { organizationId, id },
      include: {
        employee: true,
        vendor: true,
        customer: true,
        settlements: {
          orderBy: { settlementDate: "desc" }
        },
        attachments: true,
        issuedFromAccount: true,
      },
    });
  },

  updateAdvance: async (organizationId: string, id: string, data: any) => {
    return p.advance.update({
      where: { organizationId, id },
      data,
    });
  },

  listAdvances: async (organizationId: string, filters: any) => {
    let where: any = { organizationId };

    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;
    if (filters.partyId) {
      where.OR = [
        { employeeId: filters.partyId },
        { vendorId: filters.partyId },
        { customerId: filters.partyId },
      ];
    }

    return p.advance.findMany({
      where,
      include: {
        employee: true,
        vendor: true,
        customer: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  createSettlement: async (advanceId: string, settlementNumber: string, data: any) => {
    return p.advanceSettlement.create({
      data: {
        advanceId,
        settlementNumber,
        type: data.type,
        amount: new Prisma.Decimal(data.amount.toString()),
        settlementDate: data.settlementDate,
        targetAccountId: data.targetAccountId,
        expenseId: data.expenseId,
        expenseClaimId: data.expenseClaimId,
        vendorInvoiceId: data.vendorInvoiceId,
        customerInvoiceId: data.customerInvoiceId,
        reference: data.reference,
        notes: data.notes,
        journalEntryId: data.journalEntryId,
      },
    });
  },

  updateSettlement: async (id: string, data: any) => {
    return p.advanceSettlement.update({
      where: { id },
      data,
    });
  },

  getSettlementById: async (id: string) => {
    return p.advanceSettlement.findUnique({
      where: { id },
      include: { advance: true },
    });
  },

  listSettlements: async (organizationId: string, filters: any) => {
    const where: any = { advance: { organizationId } };

    if (filters.startDate || filters.endDate) {
      where.settlementDate = {};
      if (filters.startDate) where.settlementDate.gte = new Date(filters.startDate);
      if (filters.endDate) where.settlementDate.lte = new Date(filters.endDate);
    }
    if (filters.type) where.type = filters.type;
    if (filters.partyId) {
      where.advance = {
        ...(where.advance as any),
        OR: [
          { employeeId: filters.partyId },
          { vendorId: filters.partyId },
          { customerId: filters.partyId },
        ]
      };
    }
    if (filters.advanceType) {
      where.advance = {
        ...(where.advance as any),
        type: filters.advanceType
      };
    }
    if (filters.status) {
      if (filters.status === "REVERSED") {
        where.reversedAt = { not: null };
      } else {
        where.reversedAt = null;
      }
    }

    return p.advanceSettlement.findMany({
      where,
      include: {
        advance: {
          include: { employee: true, vendor: true, customer: true }
        }
      },
      orderBy: { settlementDate: "desc" },
    });
  },

  getOutstandingSummary: async (organizationId: string) => {
    const result = await p.advance.groupBy({
      by: ['type'],
      where: {
        organizationId,
        status: { in: ["ISSUED", "PARTIALLY_SETTLED"] }
      },
      _sum: {
        outstandingAmount: true
      }
    });
    return result;
  },
  
  getAgingReport: async (organizationId: string) => {
    const now = new Date();
    const advances = await p.advance.findMany({
      where: {
        organizationId,
        status: { in: ["ISSUED", "PARTIALLY_SETTLED"] },
        issueDate: { not: null }
      },
      select: {
        id: true,
        advanceNumber: true,
        type: true,
        outstandingAmount: true,
        issueDate: true,
      }
    });

    const aging: any = {
      "0-30": 0,
      "31-60": 0,
      "61-90": 0,
      "90+": 0,
    };
    const health = advances.reduce((acc: any, adv: any) => {
      const days = Math.floor((now.getTime() - adv.issueDate!.getTime()) / (1000 * 60 * 60 * 24));
      const amount = Number(adv.outstandingAmount);
      if (days <= 30) aging["0-30"] += amount;
      else if (days <= 60) aging["31-60"] += amount;
      else if (days <= 90) aging["61-90"] += amount;
      else aging["90+"] += amount;
    });

    return aging;
  },

  getAdvanceHealth: async (organizationId: string) => {
    const advances = await p.advance.findMany({
      where: { organizationId }
    });

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let totalAdvances = advances.length;
    let outstandingAmount = new Prisma.Decimal(0);
    let overdueAmount = new Prisma.Decimal(0);
    let writtenOffAmount = new Prisma.Decimal(0);
    let settledThisMonth = 0;
    
    let totalSettlementDays = 0;
    let settledCount = 0;

    for (const adv of advances) {
      if (adv.status === "ISSUED" || adv.status === "PARTIALLY_SETTLED") {
        outstandingAmount = outstandingAmount.plus(adv.outstandingAmount);
        if (adv.dueDate && adv.dueDate < now) {
          overdueAmount = overdueAmount.plus(adv.outstandingAmount);
        }
      } else if (adv.status === "SETTLED") {
        if (adv.lastSettlementDate) {
          if (adv.lastSettlementDate.getMonth() === currentMonth && adv.lastSettlementDate.getFullYear() === currentYear) {
            settledThisMonth++;
          }
          if (adv.issueDate) {
            const days = Math.floor((adv.lastSettlementDate.getTime() - adv.issueDate.getTime()) / (1000 * 60 * 60 * 24));
            totalSettlementDays += Math.max(0, days);
            settledCount++;
          }
        }
      }
    }

    // Determine writtenOffAmount from settlements (if needed properly, we can query settlements)
    const writeOffSettlements = await p.advanceSettlement.findMany({
      where: {
        advance: { organizationId },
        type: "WRITE_OFF",
        reversedAt: null
      }
    });
    for (const w of writeOffSettlements) {
      writtenOffAmount = writtenOffAmount.plus(w.amount);
    }

    return {
      totalAdvances,
      outstandingAmount: outstandingAmount.toNumber(),
      overdueAmount: overdueAmount.toNumber(),
      writtenOffAmount: writtenOffAmount.toNumber(),
      settledThisMonth,
      averageSettlementDays: settledCount > 0 ? Math.round(totalSettlementDays / settledCount) : 0
    };
  },

  getAdvanceTimeline: async (organizationId: string, advanceId: string) => {
    const advance = await p.advance.findUnique({
      where: { organizationId, id: advanceId },
      include: {
        settlements: {
          orderBy: { settlementDate: "asc" }
        }
      }
    });

    if (!advance) return null;

    const timeline: any[] = [];

    // Draft Creation
    timeline.push({
      id: `created-${advance.id}`,
      eventType: "CREATED",
      date: advance.createdAt,
      metadata: { status: "DRAFT" }
    });

    // Issuance
    if (advance.issueDate) {
      timeline.push({
        id: `issued-${advance.id}`,
        eventType: "ISSUED",
        date: advance.issueDate,
        amount: advance.amount.toNumber(),
        reference: advance.issueJournalEntryId
      });
    }

    // Settlements
    for (const settlement of advance.settlements) {
      timeline.push({
        id: `settled-${settlement.id}`,
        eventType: "SETTLED",
        date: settlement.settlementDate,
        amount: settlement.amount.toNumber(),
        reference: settlement.settlementNumber,
        metadata: {
          type: settlement.type,
          targetAccountId: settlement.targetAccountId,
          reversed: !!settlement.reversedAt
        }
      });

      if (settlement.reversedAt) {
        timeline.push({
          id: `reversed-settlement-${settlement.id}`,
          eventType: "SETTLEMENT_REVERSED",
          date: settlement.reversedAt,
          reference: settlement.reversalJournalEntryId,
          metadata: { settlementId: settlement.id }
        });
      }
    }

    // Advance Reversal
    if (advance.reversedAt) {
      timeline.push({
        id: `reversed-${advance.id}`,
        eventType: "REVERSED",
        date: advance.reversedAt,
        reference: advance.reversalJournalEntryId
      });
    }

    // Advance Void
    if (advance.status === "VOID") {
      timeline.push({
        id: `voided-${advance.id}`,
        eventType: "VOIDED",
        date: advance.updatedAt
      });
    }

    // Sort chronologically
    return timeline.sort((a, b) => a.date.getTime() - b.date.getTime());
  }
};
