import prisma from "../../../../config/database.js";
import ApiError from "../../../../utils/ApiError.js";
import { VendorInvoiceStatus } from "@prisma/client";
import { accountingService } from "../../accounting/accounting.service.js";

export type CreateVendorPaymentInput = {
  invoiceId: string;
  amount: number;
  paymentMethod: "CASH" | "BANK_TRANSFER" | "UPI" | "CARD" | "CHEQUE" | "OTHER";
  paymentDate: string;
  reference?: string;
  bankAccountId?: string;
};

export const vendorPaymentsService = {
  createPayment: async (organizationId: string, actorUserId: string, payload: CreateVendorPaymentInput) => {
    const invoice = await prisma.vendorInvoice.findUnique({
      where: { id: payload.invoiceId, organizationId }
    });

    if (!invoice) throw new ApiError(404, "Vendor Invoice not found");
    if (invoice.status === VendorInvoiceStatus.DRAFT) {
      throw new ApiError(400, `Cannot pay invoice in ${invoice.status} status`);
    }

    const result = await prisma.$transaction(async (tx: any) => {
      const payment = await tx.vendorPayment.create({
        data: {
          organizationId,
          invoiceId: payload.invoiceId,
          amount: payload.amount,
          paymentMethod: payload.paymentMethod as any,
          paymentDate: new Date(payload.paymentDate),
          reference: payload.reference,
          bankAccountId: payload.bankAccountId,
        }
      });

      if (payload.bankAccountId) {
        await tx.bankTransaction.create({
          data: {
            organizationId,
            bankAccountId: payload.bankAccountId,
            type: "WITHDRAWAL",
            amount: payload.amount,
            transactionDate: new Date(payload.paymentDate),
            description: `Payment for Vendor Invoice ${invoice.invoiceNumber}`,
            status: "PENDING",
            reference: payload.reference || `VPAY-${payment.id.substring(0, 8)}`,
          }
        });
      }

      // Update invoice status if fully paid
      const totals = await tx.vendorPayment.aggregate({
        where: { invoiceId: payload.invoiceId, deletedAt: null },
        _sum: { amount: true }
      });

      const totalPaid = Number(totals._sum.amount ?? 0);
      let newStatus = invoice.status;
      if (totalPaid >= Number(invoice.totalAmount)) {
        newStatus = VendorInvoiceStatus.PAID;
      }

      if (newStatus !== invoice.status) {
        await tx.vendorInvoice.update({
          where: { id: invoice.id },
          data: { status: newStatus as any }
        });
      }

      await accountingService.postVendorPaymentJournal(
        organizationId,
        payment.id,
        invoice.invoiceNumber,
        Number(payload.amount),
        payload.paymentMethod,
        payload.bankAccountId
      );

      return payment;
    });

    return result;
  },

  listPayments: async (organizationId: string, invoiceId?: string) => {
    return prisma.vendorPayment.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ...(invoiceId ? { invoiceId } : {})
      },
      include: {
        bankAccount: true
      },
      orderBy: { paymentDate: "desc" }
    });
  }
};
