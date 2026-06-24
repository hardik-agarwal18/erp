import { Advance } from "@prisma/client";

export interface SettlementContext {
  organizationId: string;
  advance: Advance;
  settlementAmount: number;
  data: any; // Raw payload containing targetAccountId, expenseId, etc.
  advanceAccountCodeOrId: string; // The system account ID for the advance (e.g. Employee Advance Asset)
}

export interface SettlementResult {
  journalLines: { accountId: string; debit: number; credit: number; description: string }[];
  settlementDataOverrides?: any; // Any extra data to merge into the settlement creation (like expenseId)
}

export interface SettlementHandler {
  handles(type: any): boolean;
  validate(context: SettlementContext): Promise<void>;
  process(context: SettlementContext): Promise<SettlementResult>;
}
