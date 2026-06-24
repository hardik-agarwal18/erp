import { Prisma } from "@prisma/client";
import prisma from "../../../config/database.js";
const p: any = prisma;
import ApiError from "../../../utils/ApiError.js";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES, auditService } from "../../../services/audit/index.js";
import { customerReceiptRepository } from "./customer-receipt.repository.js";
import { CreateCustomerReceiptInput } from "./customer-receipt.types.js";
import { treasuryService } from "../treasury/treasury.service.js";
import { accountMappingService } from "../accounting/mapping.service.js";
import { customerQueryService } from "../../contacts/customers/customer.query-service.js";

const generateReceiptNumber = async (organizationId: string) => {
  // Simple generator for now, can be replaced with a sequence table
  const count = await p.customerReceipt.count({ where: { organizationId } });
  return `REC-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;
};

export const customerReceiptService = {
  createCustomerReceipt: async (
    organizationId: string,
    actorUserId: string,
    payload: CreateCustomerReceiptInput
  ) => {
    // 1. Validate customer
    const customer = await customerQueryService.findById(organizationId, payload.customerId);
    if (!customer) {
      throw new ApiError(404, "Customer not found");
    }

    // 2. Validate amount and allocations
    if (payload.amount <= 0) {
      throw new ApiError(400, "Receipt amount must be greater than zero");
    }

    let allocatedTotal = 0;
    if (payload.allocations && payload.allocations.length > 0) {
      for (const alloc of payload.allocations) {
        if (alloc.allocatedAmount <= 0) throw new ApiError(400, "Allocation amount must be greater than zero");
        allocatedTotal += alloc.allocatedAmount;
      }
      if (allocatedTotal > payload.amount) {
        throw new ApiError(400, "Total allocated amount cannot exceed receipt amount");
      }
    }

    const unallocatedAmount = payload.amount - allocatedTotal;
    let status: "UNALLOCATED" | "PARTIALLY_ALLOCATED" | "ALLOCATED" = "UNALLOCATED";
    if (unallocatedAmount === 0) status = "ALLOCATED";
    else if (allocatedTotal > 0) status = "PARTIALLY_ALLOCATED";

    // 3. Get AR Account for Treasury Offset
    const arAccountId = await accountMappingService.getRequiredAccount(organizationId, "arAccountId");

    // 4. Execute Transaction
    const receipt = await prisma.$transaction(async (tx) => {
      const receiptNumber = await generateReceiptNumber(organizationId);

      const createdReceipt = await customerReceiptRepository.createReceipt(tx, organizationId, {
        customerId: payload.customerId,
        receiptNumber,
        receiptDate: new Date(payload.receiptDate),
        amount: payload.amount,
        unallocatedAmount,
        paymentMethod: payload.paymentMethod,
        reference: payload.reference,
        receivedIntoAccountId: payload.receivedIntoAccountId,
        status,
      });

      if (payload.allocations && payload.allocations.length > 0) {
        for (const alloc of payload.allocations) {
          const invoice = await customerReceiptRepository.findInvoiceForAllocation(tx, organizationId, alloc.invoiceId);
          if (!invoice) throw new ApiError(404, `Invoice ${alloc.invoiceId} not found`);

          if (Number((invoice as any).amountDue) < alloc.allocatedAmount) {
            throw new ApiError(400, `Cannot allocate ${alloc.allocatedAmount} to invoice ${invoice.invoiceNumber}. Only ${(invoice as any).amountDue} is due.`);
          }

          await customerReceiptRepository.createAllocation(tx, createdReceipt.id, alloc.invoiceId, alloc.allocatedAmount);
          await customerReceiptRepository.updateInvoiceAmountPaid(tx, organizationId, invoice.id, alloc.allocatedAmount);

          // Check if invoice is now fully paid
          const newAmountDue = Number((invoice as any).amountDue) - alloc.allocatedAmount;
          if (newAmountDue <= 0) {
            await customerReceiptRepository.updateInvoiceStatus(tx, organizationId, invoice.id, "PAID");
          } else {
            await customerReceiptRepository.updateInvoiceStatus(tx, organizationId, invoice.id, "PARTIALLY_PAID");
          }
        }
      }

      // Record Treasury Transaction (This will also generate Accounting Journal Entries inside treasuryService)
      // Since treasuryService creates its own transaction, we might need to handle it properly.
      // Wait, treasuryService.createBankTransaction creates an independent prisma.$transaction.
      // We will just invoke it directly outside the tx or use it if it supports passing tx.
      // For now we'll call it outside since treasuryService creates its own tx.

      await auditService.record(
        {
          organizationId,
          userId: actorUserId,
          action: AUDIT_ACTIONS.CUSTOMER_RECEIPT_CREATED,
          entityType: AUDIT_ENTITY_TYPES.CUSTOMER_RECEIPT,
          entityId: createdReceipt.id,
        },
        tx
      );

      return createdReceipt;
    });

    // 5. Invoke Treasury Bank Transaction (Creates Journal Entry: Debit Bank, Credit AR)
    // We pass the Bank GL Account to CreateBankTransactionInput
    // Wait, createBankTransaction requires a `bankAccountId` which is the ID of the `BankAccount` model, not the GL Account.
    // Let's look up the BankAccount that maps to `receivedIntoAccountId`.
    const bankAccount = await prisma.bankAccount.findFirst({
      where: { linkedAccountId: payload.receivedIntoAccountId, organizationId },
    });

    if (!bankAccount) {
      throw new ApiError(400, "The selected receivedIntoAccountId is not linked to any valid BankAccount.");
    }

    const bankTx = await treasuryService.createBankTransaction(organizationId, {
      bankAccountId: bankAccount.id,
      type: "DEPOSIT",
      amount: payload.amount,
      reference: receipt.receiptNumber,
      description: `Customer Receipt from ${customer.name}`,
      transactionDate: receipt.receiptDate,
      offsetAccountId: arAccountId, 
    });

    // Link treasury transaction to receipt
    await p.customerReceipt.update({
      where: { id: receipt.id },
      data: { treasuryTransactionId: bankTx.id },
    });

    return receipt;
  },

  listCustomerReceipts: async (organizationId: string, query: Record<string, unknown>) => {
    return customerReceiptRepository.listReceipts(organizationId, query);
  },
};
