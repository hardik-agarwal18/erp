// removed AdvanceSettlementType
import { SettlementHandler, SettlementContext, SettlementResult } from "./settlement-handler.interface.js";
import ApiError from "../../../../../utils/ApiError.js";

const MAX_WRITEOFF_AMOUNT = 50000; // Hardcoded limit for now, ideally fetched from organization settings

export class WriteOffHandler implements SettlementHandler {
  handles(type: any): boolean {
    return type === "WRITE_OFF";
  }

  async validate(context: SettlementContext): Promise<void> {
    if (!context.data.targetAccountId) {
      throw new ApiError(400, "Write-Off Expense Account ID is required for WRITE_OFF.");
    }
    
    if (context.settlementAmount > MAX_WRITEOFF_AMOUNT) {
      throw new ApiError(400, `Write-Off amount (${context.settlementAmount}) exceeds the maximum allowed limit without approval (${MAX_WRITEOFF_AMOUNT}).`);
    }

    if ((context.advance as any).type === "CUSTOMER") {
      throw new ApiError(400, "Cannot write-off Customer advances in this context. Customer advances are liabilities.");
    }
  }

  async process(context: SettlementContext): Promise<SettlementResult> {
    const { advanceAccountCodeOrId, data, settlementAmount, advance } = context;

    const lines = [
      { 
        accountId: data.targetAccountId, 
        debit: settlementAmount, 
        credit: 0, 
        description: `Advance Write-Off Expense for ${(advance as any).advanceNumber}` 
      },
      { 
        accountId: advanceAccountCodeOrId, 
        debit: 0, 
        credit: settlementAmount, 
        description: `Advance Settled via Write-Off` 
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
