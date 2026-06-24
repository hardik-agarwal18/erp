// removed AdvanceSettlementType
import { SettlementHandler, SettlementContext, SettlementResult } from "./settlement-handler.interface.js";
import ApiError from "../../../../../utils/ApiError.js";
import prisma from "../../../../../config/database.js";

export class ExpenseClaimHandler implements SettlementHandler {
  handles(type: any): boolean {
    return type === "EXPENSE_CLAIM";
  }

  async validate(context: SettlementContext): Promise<void> {
    if ((context.advance as any).type !== "EMPLOYEE") {
      throw new ApiError(400, "EXPENSE_CLAIM settlement is only applicable for EMPLOYEE advances.");
    }
    
    if (!context.data.expenseClaimId) {
      throw new ApiError(400, "expenseClaimId is required for EXPENSE_CLAIM settlements.");
    }

    const claim = await prisma.expenseClaim.findUnique({
      where: { id: context.data.expenseClaimId }
    });

    if (!claim) {
      throw new ApiError(404, "ExpenseClaim not found.");
    }

    if (claim.employeeId !== context.advance.employeeId) {
      throw new ApiError(400, "ExpenseClaim employee does not match the Advance employee.");
    }

    if (claim.status !== "APPROVED") {
      throw new ApiError(400, "Only APPROVED ExpenseClaims can be used to settle an advance.");
    }

    if (!context.data.targetAccountId) {
      throw new ApiError(400, "targetAccountId (Expense Account GL) is required for EXPENSE_CLAIM.");
    }
  }

  async process(context: SettlementContext): Promise<SettlementResult> {
    const { advanceAccountCodeOrId, data, settlementAmount, advance } = context;

    // Dr Expense Account
    // Cr Employee Advance Account
    const lines = [
      { 
        accountId: data.targetAccountId, 
        debit: settlementAmount, 
        credit: 0, 
        description: `Advance Applied against Expense Claim for ${(advance as any).advanceNumber}` 
      },
      { 
        accountId: advanceAccountCodeOrId, 
        debit: 0, 
        credit: settlementAmount, 
        description: `Advance Settled via Expense Claim` 
      }
    ];

    return {
      journalLines: lines,
      settlementDataOverrides: {
        targetAccountId: data.targetAccountId,
        expenseClaimId: data.expenseClaimId
      }
    };
  }
}
