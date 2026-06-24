import ApiError from "../../../../utils/ApiError.js";
import prisma from "../../../../config/database.js";
import { VendorInvoiceStatus, PaymentMethod } from "@prisma/client";
import { eventBus } from "../../../../shared/events/event-bus.js";

export const vendorPaymentsService = {
  createPayment: async (organizationId: string, actorUserId: string, payload: {
    vendorId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentDate: Date | string;
    reference?: string;
    bankAccountId?: string;
  }) => {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.vendorPayment.create({
        data: {
          organizationId,
          vendorId: payload.vendorId,
          amount: payload.amount,
          paymentMethod: payload.paymentMethod,
          paymentDate: new Date(payload.paymentDate),
          reference: payload.reference,
          bankAccountId: payload.bankAccountId
        }
      });

      await (tx as any).outboxEvent.create({
        data: {
          organizationId,
          aggregateType: "VendorPayment",
          aggregateId: payment.id,
          eventType: "VendorPaymentCreated",
          payload: {
             paymentId: payment.id,
             amount: payment.amount,
             vendorId: payment.vendorId,
             actorUserId
          }
        }
      });

      return payment;
    });
  },

  allocatePayment: async (organizationId: string, actorUserId: string, paymentId: string, allocations: { invoiceId: string, amount: number }[]) => {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.vendorPayment.findFirst({
        where: { id: paymentId, organizationId },
        include: { allocations: true }
      });
      if (!payment) throw new ApiError(404, "Vendor Payment not found");

      const alreadyAllocated = payment.allocations.reduce((sum, a) => sum + Number(a.amount), 0);
      const totalNewAllocation = allocations.reduce((sum, a) => sum + a.amount, 0);

      if (alreadyAllocated + totalNewAllocation > Number(payment.amount)) {
        throw new ApiError(400, "Allocation amounts exceed available payment amount");
      }

      for (const allocation of allocations) {
         const invoice = await tx.vendorInvoice.findFirst({
            where: { id: allocation.invoiceId, organizationId },
            include: { allocations: true }
         });
         
         if (!invoice) throw new ApiError(404, `Invoice \${allocation.invoiceId} not found`);
         if (invoice.vendorId !== payment.vendorId) {
            throw new ApiError(400, `Invoice \${allocation.invoiceId} belongs to a different vendor`);
         }

         const invoiceAlreadyPaid = invoice.allocations.reduce((sum, a) => sum + Number(a.amount), 0);
         const remainingBalance = Number(invoice.totalAmount) - invoiceAlreadyPaid;

         if (allocation.amount > remainingBalance) {
            throw new ApiError(400, `Cannot allocate \${allocation.amount} to invoice \${invoice.invoiceNumber}. Remaining balance is \${remainingBalance}`);
         }

         await tx.vendorPaymentAllocation.create({
            data: {
              paymentId: payment.id,
              invoiceId: allocation.invoiceId,
              amount: allocation.amount
            }
         });

         const newPaidAmount = invoiceAlreadyPaid + allocation.amount;
         const isFullyPaid = newPaidAmount >= Number(invoice.totalAmount);

         await tx.vendorInvoice.update({
            where: { id: invoice.id },
            data: { 
               status: isFullyPaid ? VendorInvoiceStatus.PAID : VendorInvoiceStatus.PARTIALLY_PAID
            }
         });
      }

      const updatedPayment = await tx.vendorPayment.findFirst({
         where: { id: paymentId },
         include: { allocations: true }
      });

      return updatedPayment;
    });
  }
};
