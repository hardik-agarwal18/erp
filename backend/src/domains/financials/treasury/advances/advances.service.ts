import { advancesRepository } from "./advances.repository.js";
import { treasuryRepository } from "../treasury.repository.js";
import { accountingService } from "../../accounting/accounting.service.js";
import { accountingRepository } from "../../accounting/accounting.repository.js";
import ApiError from "../../../../utils/ApiError.js";
import { Prisma } from "@prisma/client";
import { 
  emitAdvanceCreated, 
  emitAdvanceIssued, 
  emitAdvanceSettled, 
  emitAdvanceVoided, 
  emitAdvanceReversed 
} from "../../../../shared/events/event-bus.js";
import { getSettlementHandler } from "./settlement-handlers/index.js";
import { auditService } from "../../../../infrastructure/audit/audit.service.js";

const getSystemAccount = async (organizationId: string, type: "EMPLOYEE" | "VENDOR" | "CUSTOMER") => {
  const accounts = await accountingRepository.listAccounts(organizationId);
  
  const code = `${type}_ADVANCE`;
  const name = `${type.charAt(0) + type.slice(1).toLowerCase()} Advance`;
  
  let account = accounts.find((a: any) => a.code === code || a.name === name);
  if (!account) {
    account = await accountingRepository.createAccount(organizationId, {
      code,
      name,
      type: type === "CUSTOMER" ? "LIABILITY" : "ASSET",
      normalBalance: type === "CUSTOMER" ? "CREDIT" : "DEBIT",
      isSystem: true,
    });
  }
  return account;
};

export const advancesService = {
  createAdvance: async (organizationId: string, data: any) => {
    const advanceNumber = await advancesRepository.getNextAdvanceNumber(organizationId);
    const advance: any = await advancesRepository.createAdvance(organizationId, advanceNumber, data);
    emitAdvanceCreated({ organizationId, advanceId: advance.id });
    
    await auditService.log({
      organizationId,
      actorUserId: data.createdByUserId || "SYSTEM", // Ideally passed in
      action: "TREASURY_ADVANCE_CREATED",
      entityType: "Advance",
      entityId: advance.id,
      metadata: { advanceNumber: advance.advanceNumber, amount: Number(data.amount) },
    });

    return advance;
  },

  issueAdvance: async (organizationId: string, advanceId: string) => {
    const advance: any = await advancesRepository.getAdvanceById(organizationId, advanceId);
    if (!advance) throw new ApiError(404, "Advance not found");
    if (advance.status !== "DRAFT") throw new ApiError(400, "Only DRAFT advances can be issued.");
    if (!advance.issuedFromAccountId) throw new ApiError(400, "Advance must have an issuedFromAccountId to be issued.");

    const bankAccount = advance.issuedFromAccount;
    if (!bankAccount || bankAccount.isFrozen || bankAccount.closedAt) {
      throw new ApiError(400, "Cannot issue advance from a frozen or closed account.");
    }

    const advanceAccount = await getSystemAccount(organizationId, advance.type as "EMPLOYEE" | "VENDOR" | "CUSTOMER");
    
    const amount = Number(advance.amount);
    const lines = [];

    if (advance.type === "CUSTOMER") {
      // Receive Advance: Dr Bank/Cash, Cr Customer Advance Liability
      lines.push({ accountId: bankAccount.linkedAccountId, debit: amount, credit: 0, description: `Advance Received from Customer: ${advance.advanceNumber}` });
      lines.push({ accountId: advanceAccount.id, debit: 0, credit: amount, description: `Customer Advance Liability: ${advance.advanceNumber}` });
    } else {
      // Issue Advance: Dr Employee/Vendor Advance Asset, Cr Bank/Cash
      lines.push({ accountId: advanceAccount.id, debit: amount, credit: 0, description: `Advance Issued to ${advance.type}: ${advance.advanceNumber}` });
      lines.push({ accountId: bankAccount.linkedAccountId, debit: 0, credit: amount, description: `Advance Payout: ${advance.advanceNumber}` });
    }

    const journalEntry = await accountingService.postJournalEntry(organizationId, {
      description: `Advance Issued: ${advance.advanceNumber}`,
      referenceType: "ADVANCE",
      referenceId: advance.advanceNumber,
      postedAt: new Date(),
      lines,
    });

    await advancesRepository.updateAdvance(organizationId, advanceId, {
      status: "ISSUED",
      issueDate: new Date(),
      issueJournalEntryId: journalEntry.id,
    } as any);

    emitAdvanceIssued({ organizationId, advanceId: advance.id });
    
    await auditService.log({
      organizationId,
      actorUserId: "SYSTEM", // If no user provided, default to SYSTEM. Wait, we should probably pass userId
      action: "TREASURY_ADVANCE_ISSUED",
      entityType: "Advance",
      entityId: advance.id,
      metadata: { advanceNumber: advance.advanceNumber, amount },
    });

    return advancesRepository.getAdvanceById(organizationId, advanceId);
  },

  settleAdvance: async (organizationId: string, advanceId: string, data: any) => {
    const advance = await advancesRepository.getAdvanceById(organizationId, advanceId);
    if (!advance) throw new ApiError(404, "Advance not found");
    if (advance.status !== "ISSUED" && advance.status !== "PARTIALLY_SETTLED") {
      throw new ApiError(400, "Only ISSUED or PARTIALLY_SETTLED advances can be settled.");
    }

    const settlementAmount = Number(data.amount);
    const outstanding = Number(advance.outstandingAmount);
    if (settlementAmount > outstanding) {
      throw new ApiError(400, `Settlement amount (${settlementAmount}) exceeds outstanding amount (${outstanding}).`);
    }

    const advanceAccount = await getSystemAccount(organizationId, advance.type as "EMPLOYEE" | "VENDOR" | "CUSTOMER");
    
    const handler = getSettlementHandler(data.type || "OTHER");
    
    await handler.validate({
      organizationId,
      advance,
      settlementAmount,
      data,
      advanceAccountCodeOrId: advanceAccount.id
    });

    const result = await handler.process({
      organizationId,
      advance,
      settlementAmount,
      data,
      advanceAccountCodeOrId: advanceAccount.id
    });

    const settlementNumber = await advancesRepository.getNextSettlementNumber(organizationId);

    const journalEntry = await accountingService.postJournalEntry(organizationId, {
      description: `Advance Settlement ${settlementNumber}: ${advance.advanceNumber}`,
      referenceType: "ADVANCE_SETTLEMENT",
      referenceId: settlementNumber,
      postedAt: data.settlementDate || new Date(),
      lines: result.journalLines,
    });

    await advancesRepository.createSettlement(advanceId, settlementNumber, {
      ...data,
      ...result.settlementDataOverrides,
      journalEntryId: journalEntry.id,
    });

    const newOutstanding = outstanding - settlementAmount;
    const newStatus = newOutstanding <= 0 ? "SETTLED" : "PARTIALLY_SETTLED";

    await advancesRepository.updateAdvance(organizationId, advanceId, {
      outstandingAmount: newOutstanding,
      status: newStatus,
      lastSettlementDate: data.settlementDate || new Date(),
    } as any);

    emitAdvanceSettled({ organizationId, advanceId: advance.id });
    
    await auditService.log({
      organizationId,
      actorUserId: data.actorUserId || "SYSTEM",
      action: "TREASURY_ADVANCE_SETTLED",
      entityType: "Advance",
      entityId: advance.id,
      metadata: { settlementNumber, amount: settlementAmount, newOutstanding },
    });

    return advancesRepository.getAdvanceById(organizationId, advanceId);
  },

  reverseAdvance: async (organizationId: string, advanceId: string, userId: string, reason: string) => {
    const advance = await advancesRepository.getAdvanceById(organizationId, advanceId);
    if (!advance) throw new ApiError(404, "Advance not found");
    if (advance.status === "REVERSED") throw new ApiError(400, "Advance is already reversed.");
    if (!(advance as any).issueJournalEntryId) throw new ApiError(400, "Cannot reverse an advance with no posted issue journal entry.");

    const reversalEntry = await accountingService.reverseJournalEntry(organizationId, (advance as any).issueJournalEntryId, new Date());

    await advancesRepository.updateAdvance(organizationId, advanceId, {
      status: "REVERSED",
      reversalJournalEntryId: reversalEntry.id,
      reversedAt: new Date(),
      reversedBy: { connect: { id: userId } },
    } as any);

    emitAdvanceReversed({ organizationId, advanceId: advance.id });

    await auditService.log({
      organizationId,
      actorUserId: userId,
      action: "TREASURY_ADVANCE_REVERSED",
      entityType: "Advance",
      entityId: advance.id,
      metadata: { reason, advanceNumber: (advance as any).advanceNumber },
    });

    return advancesRepository.getAdvanceById(organizationId, advanceId);
  },

  reverseSettlement: async (organizationId: string, settlementId: string, userId: string) => {
    const settlement = await advancesRepository.getSettlementById(settlementId);
    if (!settlement) throw new ApiError(404, "Settlement not found");
    if (settlement.advance.organizationId !== organizationId) throw new ApiError(403, "Forbidden");
    if (settlement.reversedAt) throw new ApiError(400, "Settlement is already reversed");
    if (!settlement.journalEntryId) throw new ApiError(400, "Cannot reverse a settlement with no posted journal entry");

    const reversalEntry = await accountingService.reverseJournalEntry(organizationId, settlement.journalEntryId, new Date());

    await advancesRepository.updateSettlement(settlementId, {
      reversedAt: new Date(),
      reversedById: userId,
      reversalJournalEntryId: reversalEntry.id
    } as any);

    const advance = settlement.advance;
    const newOutstanding = Number(advance.outstandingAmount) + Number(settlement.amount);
    const newStatus = newOutstanding >= Number(advance.amount) ? "ISSUED" : "PARTIALLY_SETTLED"; // Simplistic status revert

    await advancesRepository.updateAdvance(organizationId, advance.id, {
      outstandingAmount: new Prisma.Decimal(newOutstanding.toString()),
      status: newStatus
    } as any);

    return advancesRepository.getAdvanceById(organizationId, advance.id);
  },

  voidAdvance: async (organizationId: string, advanceId: string, userId: string) => {
    const advance = await advancesRepository.getAdvanceById(organizationId, advanceId);
    if (!advance) throw new ApiError(404, "Advance not found");
    if (advance.status !== "DRAFT") throw new ApiError(400, "Only DRAFT advances can be voided.");

    await advancesRepository.updateAdvance(organizationId, advanceId, { status: "VOID" } as any);
    emitAdvanceVoided({ organizationId, advanceId: advance.id });

    await auditService.log({
      organizationId,
      actorUserId: userId,
      action: "TREASURY_ADVANCE_VOIDED",
      entityType: "Advance",
      entityId: advance.id,
      metadata: { advanceNumber: (advance as any).advanceNumber },
    });

    return advancesRepository.getAdvanceById(organizationId, advanceId);
  },

  listSettlements: async (organizationId: string, filters: any) => {
    return advancesRepository.listSettlements(organizationId, filters);
  },

  getAdvanceTimeline: async (organizationId: string, advanceId: string) => {
    return advancesRepository.getAdvanceTimeline(organizationId, advanceId);
  },

  getAdvanceHealth: async (organizationId: string) => {
    return advancesRepository.getAdvanceHealth(organizationId);
  },

  listAdvances: async (organizationId: string, filters: any) => {
    return advancesRepository.listAdvances(organizationId, filters);
  },

  getAdvanceById: async (organizationId: string, id: string) => {
    return advancesRepository.getAdvanceById(organizationId, id);
  },

  getOutstandingSummary: async (organizationId: string) => {
    return advancesRepository.getOutstandingSummary(organizationId);
  },

  getAgingReport: async (organizationId: string) => {
    return advancesRepository.getAgingReport(organizationId);
  }
};
