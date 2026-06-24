// removed AdvanceSettlementType
import { SettlementHandler, SettlementContext, SettlementResult } from "./settlement-handler.interface.js";
import ApiError from "../../../../../utils/ApiError.js";

export class OtherHandler implements SettlementHandler {
  handles(type: any): boolean {
    return type === "OTHER" || type === "EXPENSE";
  }

  async validate(context: SettlementContext): Promise<void> {
    if (!context.data.targetAccountId) {
      throw new ApiError(400, "targetAccountId is required for basic/other settlements.");
    }
  }

  async process(context: SettlementContext): Promise<SettlementResult> {
    const { advanceAccountCodeOrId, data, settlementAmount, advance } = context;

    const lines = [];

    if ((context.advance as any).type === "CUSTOMER") {
      // Settle Customer Liability
      lines.push({ accountId: advanceAccountCodeOrId, debit: settlementAmount, credit: 0, description: `Customer Advance Settlement: ${(advance as any).advanceNumber}` });
      lines.push({ accountId: data.targetAccountId, debit: 0, credit: settlementAmount, description: `Customer Advance Applied` });
    } else {
      // Settle Employee/Vendor Asset
      lines.push({ accountId: data.targetAccountId, debit: settlementAmount, credit: 0, description: `Advance Settled` });
      lines.push({ accountId: advanceAccountCodeOrId, debit: 0, credit: settlementAmount, description: `Advance Settled via Other (Liability adjustment) for ${(advance as any).advanceNumber}` });
    }

    return {
      journalLines: lines,
      settlementDataOverrides: {
        targetAccountId: data.targetAccountId,
        expenseId: data.expenseId
      }
    };
  }
}
