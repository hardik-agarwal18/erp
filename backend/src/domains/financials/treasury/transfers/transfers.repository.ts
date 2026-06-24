import { Prisma } from "@prisma/client";
import { prisma } from "../../../../config/database.js";
import { CreateTreasuryTransferInput, TreasuryTransferFilters } from "../treasury.types.js";

export const transfersRepository = {
  createTreasuryTransfer: async (organizationId: string, transferSequence: string, data: CreateTreasuryTransferInput, createdById: string, journalEntryId?: string) => {
    return prisma.treasuryTransfer.create({
      data: {
        organizationId,
        transferSequence,
        fromAccountId: data.fromAccountId,
        toAccountId: data.toAccountId,
        amount: new Prisma.Decimal(data.amount.toString()),
        transferDate: data.transferDate,
        reference: data.reference,
        externalReference: data.externalReference,
        description: data.description,
        notes: data.notes,
        status: data.status || "POSTED",
        journalEntryId,
      },
      include: {
        fromAccount: true,
        toAccount: true,
      },
    });
  },

  getTreasuryTransferById: async (organizationId: string, id: string) => {
    return prisma.treasuryTransfer.findUnique({
      where: { organizationId, id },
      include: {
        fromAccount: true,
        toAccount: true,
        journalEntry: {
          include: { lines: true }
        }
      }
    });
  },

  updateTreasuryTransfer: async (organizationId: string, id: string, data: Partial<Prisma.TreasuryTransferUpdateInput>) => {
    return prisma.treasuryTransfer.update({
      where: { organizationId, id },
      data,
    });
  },

  listTreasuryTransfers: async (organizationId: string, filters: TreasuryTransferFilters) => {
    const where: Prisma.TreasuryTransferWhereInput = {
      organizationId,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.transferDate = {};
      if (filters.startDate) {
        where.transferDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        const endOfDay = new Date(filters.endDate);
        endOfDay.setUTCHours(23, 59, 59, 999);
        where.transferDate.lte = endOfDay;
      }
    }

    return prisma.treasuryTransfer.findMany({
      where,
      include: {
        fromAccount: true,
        toAccount: true,
      },
      orderBy: {
        transferDate: "desc",
      },
    });
  },

  getNextTransferNumber: async (organizationId: string): Promise<string> => {
    return prisma.$transaction(async (tx) => {
      let sequence = await (tx as any).transferSequence.findUnique({
        where: { organizationId },
      });

      if (!sequence) {
        sequence = await (tx as any).transferSequence.create({
          data: { organizationId },
        });
      }

      const nextNum = sequence.nextNumber;
      await (tx as any).transferSequence.update({
        where: { id: sequence.id },
        data: { nextNumber: { increment: 1 } },
      });

      const year = new Date().getFullYear();
      return `${sequence.prefix}-${year}-${nextNum.toString().padStart(6, "0")}`;
    });
  },
};
