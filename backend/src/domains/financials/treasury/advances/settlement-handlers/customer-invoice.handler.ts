// removed AdvanceSettlementType
import { SettlementHandler, SettlementContext, SettlementResult } from "./settlement-handler.interface.js";
import ApiError from "../../../../../utils/ApiError.js";
import prisma from "../../../../../config/database.js";

export class CustomerInvoiceHandler implements SettlementHandler {
  handles(type: any): boolean {
    return type === "CUSTOMER_INVOICE";
  }

  async validate(context: SettlementContext): Promise<void> {
    if ((context.advance as any).type !== "CUSTOMER") {
      throw new ApiError(400, "CUSTOMER_INVOICE settlement is only applicable for CUSTOMER advances.");
    }
    
    if (!context.data.customerInvoiceId) {
      throw new ApiError(400, "customerInvoiceId is required for CUSTOMER_INVOICE settlements.");
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: context.data.customerInvoiceId }
    });

    if (!invoice) {
      throw new ApiError(404, "Customer Invoice not found.");
    }

    if (invoice.customerId !== (context.advance as any).customerId) {
      throw new ApiError(400, "Invoice customer does not match the Advance customer.");
    }

    if (!context.data.targetAccountId) {
      throw new ApiError(400, "targetAccountId (Accounts Receivable GL) is required for CUSTOMER_INVOICE.");
    }
  }

  async process(context: SettlementContext): Promise<SettlementResult> {
    const { advanceAccountCodeOrId, data, settlementAmount, advance } = context;

    // Dr Customer Advance (Liability)
    // Cr Accounts Receivable (Asset)
    const lines = [
      { 
        accountId: advanceAccountCodeOrId, 
        debit: settlementAmount, 
        credit: 0, 
        description: `Customer Advance Applied to Invoice: ${(advance as any).advanceNumber}` 
      },
      { 
        accountId: data.targetAccountId, 
        debit: 0, 
        credit: settlementAmount, 
        description: `Advance Applied against Customer Invoice` 
      }
    ];

    return {
      journalLines: lines,
      settlementDataOverrides: {
        targetAccountId: data.targetAccountId,
        customerInvoiceId: data.customerInvoiceId
      }
    };
  }
}
