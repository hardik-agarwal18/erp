import { accountingRepository } from "../accounting.repository.js";
import { CreateJournalEntryInput } from "../accounting.types.js";
import prisma from "../../../../config/database.js";

export const stockAdjustmentAccountingHandler = {
  async handle(organizationId: string, event: any) {
    const { journalId } = event.payload;

    const journal = await prisma.stockJournal.findUnique({
      where: { id: journalId },
      include: {
        items: true
      }
    });

    if (!journal) {
      throw new Error(`StockJournal ${journalId} not found`);
    }

    // A real implementation would calculate exactly how much value is gained or lost 
    // by comparing the average cost of the items transferred and any adjustments.
    const adjustmentValue = 0; // Simplified for now

    const entryDto: any = {
      organizationId,
      description: `Stock Adjustment / Journal ${journal.journalNumber}`,
      referenceType: "StockAdjustment",
      referenceId: journal.id,
      sourceEventId: event.id,
      lines: [
        {
          accountId: "account-inventory-asset",
          credit: Number(adjustmentValue),
          type: "CREDIT",
          description: "Inventory Asset Adjustment"
        } as any,
        {
          accountId: "account-inventory-gain-loss",
          debit: Number(adjustmentValue),
          type: "DEBIT",
          description: "Inventory Gain/Loss"
        } as any
      ]
    };

    // We only create an entry if there's actual value adjusted
    if (adjustmentValue > 0) {
      const period = await prisma.accountingPeriod.findFirst({ where: { organizationId } });
      await (accountingRepository as any).createJournalEntry(entryDto as any);
    }
  }
};
