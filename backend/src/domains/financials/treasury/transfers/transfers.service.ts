import { transfersRepository } from "./transfers.repository.js";
import { treasuryRepository } from "../treasury.repository.js";
import { accountingService } from "../../accounting/accounting.service.js";
import ApiError from "../../../../utils/ApiError.js";
import { CreateTreasuryTransferInput, TreasuryTransferFilters } from "../treasury.types.js";
import { emitTreasuryTransferPosted, emitTreasuryTransferReversed } from "../../../../shared/events/event-bus.js";
import { auditService } from "../../../../infrastructure/audit/audit.service.js";

export const transfersService = {
  createTreasuryTransfer: async (organizationId: string, userId: string, data: CreateTreasuryTransferInput) => {
    if (data.fromAccountId === data.toAccountId) {
      throw new ApiError(400, "Cannot transfer to the same account.");
    }

    if (data.amount <= 0) {
      throw new ApiError(400, "Transfer amount must be strictly positive.");
    }

    const fromAccount = await treasuryRepository.getBankAccountById(organizationId, data.fromAccountId);
    const toAccount = await treasuryRepository.getBankAccountById(organizationId, data.toAccountId);

    if (!fromAccount || !toAccount) {
      throw new ApiError(404, "One or both bank accounts not found.");
    }

    if (fromAccount.isFrozen || toAccount.isFrozen) {
      throw new ApiError(400, "Cannot transfer involving a frozen account.");
    }
    
    if (fromAccount.closedAt || toAccount.closedAt) {
      throw new ApiError(400, "Cannot transfer involving a closed account.");
    }

    const transferSequence = await transfersRepository.getNextTransferNumber(organizationId);

    let journalEntryId: string | undefined;

    if (data.status === "POSTED" || !data.status) {
      const lines = [
        {
          accountId: toAccount.linkedAccountId,
          debit: data.amount,
          credit: 0,
          description: data.description || `Transfer from ${fromAccount.name}`,
        },
        {
          accountId: fromAccount.linkedAccountId,
          debit: 0,
          credit: data.amount,
          description: data.description || `Transfer to ${toAccount.name}`,
        }
      ];

      const journalEntry = await accountingService.postJournalEntry(organizationId, {
        description: data.description || `Treasury Transfer ${transferSequence}`,
        referenceType: "TREASURY_TRANSFER",
        referenceId: transferSequence,
        postedAt: data.transferDate,
        lines,
      });
      journalEntryId = journalEntry.id;
    }

    const transfer = await transfersRepository.createTreasuryTransfer(organizationId, transferSequence, data, userId, journalEntryId);
    
    if (transfer.status === "POSTED") {
      emitTreasuryTransferPosted({ organizationId, transferId: transfer.id });
      await auditService.log({
        organizationId,
        actorUserId: userId,
        action: "TREASURY_TRANSFER_POSTED",
        entityType: "TreasuryTransfer",
        entityId: transfer.id,
        metadata: { transferSequence: transfer.transferSequence, amount: Number(data.amount) },
      });
    }
    
    return transfer;
  },

  listTreasuryTransfers: async (organizationId: string, filters: TreasuryTransferFilters) => {
    return transfersRepository.listTreasuryTransfers(organizationId, filters);
  },

  reverseTreasuryTransfer: async (organizationId: string, transferId: string, userId: string, reversalReason: string) => {
    const transfer = await transfersRepository.getTreasuryTransferById(organizationId, transferId);
    
    if (!transfer) {
      throw new ApiError(404, "Treasury Transfer not found.");
    }

    if (transfer.status !== "POSTED") {
      throw new ApiError(400, "Only POSTED transfers can be reversed.");
    }

    if (!transfer.journalEntryId || !transfer.journalEntry) {
      throw new ApiError(500, "Missing original journal entry, cannot reverse.");
    }

    // 1. Create a reversing journal entry (swap debits and credits)
    const reversedLines = transfer.journalEntry.lines.map(line => ({
      accountId: line.accountId,
      debit: Number(line.credit),
      credit: Number(line.debit),
      description: `Reversal of ${line.description || transfer.transferSequence}`,
    }));

    const reversalEntry = await accountingService.postJournalEntry(organizationId, {
      description: `Reversal of Transfer ${transfer.transferSequence}`,
      referenceType: "TREASURY_TRANSFER_REVERSAL",
      referenceId: transfer.transferSequence,
      postedAt: new Date(),
      lines: reversedLines,
    });

    // 2. Update the transfer status and link the reversal entry
    const updatedTransfer = await transfersRepository.updateTreasuryTransfer(organizationId, transferId, {
      status: "REVERSED",
      reversalJournalEntry: { connect: { id: reversalEntry.id } },
      reversalReason,
    });

    emitTreasuryTransferReversed({ organizationId, transferId });
    
    await auditService.log({
      organizationId,
      actorUserId: userId,
      action: "TREASURY_TRANSFER_REVERSED",
      entityType: "TreasuryTransfer",
      entityId: transfer.id,
      metadata: { transferSequence: transfer.transferSequence, reversalReason },
    });

    return updatedTransfer;
  },
};
