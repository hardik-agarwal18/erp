// removed AdvanceSettlementType
import { SettlementHandler, SettlementContext, SettlementResult } from "./settlement-handler.interface.js";
import ApiError from "../../../../../utils/ApiError.js";

export class CashReturnHandler implements SettlementHandler {
  handles(type: any): boolean {
    return type === "CASH_RETURN";
  }

  async validate(context: SettlementContext): Promise<void> {
    if (!context.data.targetAccountId) {
      throw new ApiError(400, "Target Bank/Cash Account ID is required for CASH_RETURN.");
    }
    // Only EMPLOYEE or VENDOR typically return cash (Assets). Customer returns are rare or handled as refunds.
    if ((context.advance as any).type === "CUSTOMER") {
      throw new ApiError(400, "CASH_RETURN is generally not supported for CUSTOMER advances (Liability). Use refunds instead.");
    }
  }

  async process(context: SettlementContext): Promise<SettlementResult> {
    const { advanceAccountCodeOrId, data, settlementAmount, advance } = context;

    const lines = [
      { 
        accountId: data.targetAccountId, 
        debit: settlementAmount, 
        credit: 0, 
        description: `Cash Return for Advance ${(advance as any).advanceNumber}` 
      },
      { 
        accountId: advanceAccountCodeOrId, 
        debit: 0, 
        credit: settlementAmount, 
        description: `Advance Settled via Cash Return` 
      }
    ];

    return {
      journalLines: lines,
      settlementDataOverrides: {
        targetAccountId: data.targetAccountId
      }
    };
  }
}
