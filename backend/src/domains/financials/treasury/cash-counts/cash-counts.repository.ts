import { Prisma } from "@prisma/client";
import { prisma } from "../../../../config/database.js";
const p: any = prisma;

export const cashCountsRepository = {
  getNextCountNumber: async (organizationId: string): Promise<string> => {
    return prisma.$transaction(async (tx) => {
      let sequence = await p.cashCountSequence.findUnique({
        where: { organizationId },
      });

      if (!sequence) {
        sequence = await p.cashCountSequence.create({
          data: { organizationId },
        });
      }

      const nextNum = sequence.nextNumber;
      await p.cashCountSequence.update({
        where: { id: sequence.id },
        data: { nextNumber: { increment: 1 } },
      });

      const year = new Date().getFullYear();
      return `${sequence.prefix}-${year}-${nextNum.toString().padStart(5, "0")}`;
    });
  },

  createCashCount: async (organizationId: string, countNumber: string, data: any) => {
    return p.cashCount.create({
      data: {
        organizationId,
        countNumber,
        bankAccountId: data.bankAccountId,
        expectedBalance: new Prisma.Decimal(data.expectedBalance.toString()),
        countedBalance: new Prisma.Decimal(data.countedBalance.toString()),
        varianceAmount: new Prisma.Decimal(data.varianceAmount.toString()),
        notes: data.notes,
        countStartedAt: data.countStartedAt,
        countCompletedAt: data.countCompletedAt,
        countDate: data.countDate || new Date(),
        countedById: data.countedById,
        verifiedByEmployeeId: data.verifiedByEmployeeId,
        status: data.status || "DRAFT",
      },
      include: {
        bankAccount: true,
        countedBy: true,
        verifiedBy: true,
      },
    });
  },

  getCashCountById: async (organizationId: string, id: string) => {
    return p.cashCount.findUnique({
      where: { organizationId, id },
      include: {
        bankAccount: true,
        countedBy: true,
        verifiedBy: true,
      },
    });
  },

  updateCashCount: async (organizationId: string, id: string, data: Partial<any>) => {
    return p.cashCount.update({
      where: { organizationId, id },
      data,
      include: {
        bankAccount: true,
      }
    });
  },

  listCashCounts: async (organizationId: string, filters: any) => {
    const where: any = { organizationId };

    if (filters.bankAccountId) where.bankAccountId = filters.bankAccountId;
    if (filters.status) where.status = filters.status;

    return p.cashCount.findMany({
      where,
      include: {
        bankAccount: true,
        countedBy: true,
        verifiedBy: true,
      },
      orderBy: { countDate: "desc" },
    });
  },
};
