import { SettlementHandler } from "./settlement-handler.interface.js";
import { CashReturnHandler } from "./cash-return.handler.js";
import { WriteOffHandler } from "./writeoff.handler.js";
import { ExpenseClaimHandler } from "./expense-claim.handler.js";
import { VendorInvoiceHandler } from "./vendor-invoice.handler.js";
import { CustomerInvoiceHandler } from "./customer-invoice.handler.js";
import { OtherHandler } from "./other.handler.js";
// import { AdvanceSettlementType } from "@prisma/client";
import ApiError from "../../../../../utils/ApiError.js";

const handlers: SettlementHandler[] = [
  new CashReturnHandler(),
  new WriteOffHandler(),
  new ExpenseClaimHandler(),
  new VendorInvoiceHandler(),
  new CustomerInvoiceHandler(),
  new OtherHandler()
];

export const getSettlementHandler = (type: any): SettlementHandler => {
  const handler = handlers.find(h => h.handles(type));
  if (!handler) {
    throw new ApiError(500, `No settlement handler found for type ${type}`);
  }
  return handler;
};
