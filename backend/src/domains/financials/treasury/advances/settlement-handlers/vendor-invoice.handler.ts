// removed AdvanceSettlementType
import { SettlementHandler, SettlementContext, SettlementResult } from "./settlement-handler.interface.js";
import ApiError from "../../../../../utils/ApiError.js";
import prisma from "../../../../../config/database.js";

export class VendorInvoiceHandler implements SettlementHandler {
  handles(type: any): boolean {
    return type === "VENDOR_INVOICE";
  }

  async validate(context: SettlementContext): Promise<void> {
    if ((context.advance as any).type !== "VENDOR") {
      throw new ApiError(400, "VENDOR_INVOICE settlement is only applicable for VENDOR advances.");
    }
    
    if (!context.data.vendorInvoiceId) {
      throw new ApiError(400, "vendorInvoiceId is required for VENDOR_INVOICE settlements.");
    }

    const invoice = await prisma.vendorInvoice.findUnique({
      where: { id: context.data.vendorInvoiceId }
    });

    if (!invoice) {
      throw new ApiError(404, "VendorInvoice not found.");
    }

    if (invoice.vendorId !== (context.advance as any).vendorId) {
      throw new ApiError(400, "VendorInvoice vendor does not match the Advance vendor.");
    }

    if (!context.data.targetAccountId) {
      throw new ApiError(400, "targetAccountId (Accounts Payable GL) is required for VENDOR_INVOICE.");
    }
  }

  async process(context: SettlementContext): Promise<SettlementResult> {
    const { advanceAccountCodeOrId, data, settlementAmount, advance } = context;

    // Dr Accounts Payable
    // Cr Vendor Advance
    const lines = [
      { 
        accountId: data.targetAccountId, 
        debit: settlementAmount, 
        credit: 0, 
        description: `Advance Applied against Vendor Invoice` 
      },
      { 
        accountId: advanceAccountCodeOrId, 
        debit: 0, 
        credit: settlementAmount, 
        description: `Vendor Advance Settled: ${(advance as any).advanceNumber}` 
      }
    ];

    return {
      journalLines: lines,
      settlementDataOverrides: {
        targetAccountId: data.targetAccountId,
        vendorInvoiceId: data.vendorInvoiceId
      }
    };
  }
}
