
import prisma from "../../../config/database.js";
import ApiError from "../../../utils/ApiError.js";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  auditService,
} from "../../../services/audit/index.js";
import { paymentRepository } from "./payment.repository.js";
import { CreatePaymentInput } from "./payment.types.js";

const resolveInvoiceStatus = (totalPaid: number, totalAmount: number) => {
  if (totalPaid >= totalAmount) {
    return "PAID";
  }
  if (totalPaid > 0) {
    return "PARTIALLY_PAID";
  }
  return "ISSUED";
};

export const paymentService = {
  createPayment: async (
    organizationId: string,
    actorUserId: string,
    payload: CreatePaymentInput,
  ) => {
    const invoice = await paymentRepository.findInvoiceById(
      organizationId,
      payload.invoiceId,
    );
    if (!invoice) {
      throw new ApiError(404, "Invoice not found");
    }

    const result = await prisma.$transaction(async (tx) => {
      const scopedInvoice = await paymentRepository.findInvoiceById(
        organizationId,
        payload.invoiceId,
        tx,
      );
      if (!scopedInvoice) {
        throw new ApiError(404, "Invoice not found");
      }

      const payment = await paymentRepository.createPaymentForOrganization(
        tx,
        organizationId,
        payload,
      );

      const totals = await paymentRepository.sumPaymentsForInvoice(
        tx,
        organizationId,
        payload.invoiceId,
      );

      const totalPaid = Number(totals._sum.amount ?? 0);
      if (totalPaid > Number(scopedInvoice.totalAmount)) {
        throw new ApiError(400, "Payment amount exceeds invoice total");
      }
      const status = resolveInvoiceStatus(
        totalPaid,
        Number(scopedInvoice.totalAmount),
      );

      await paymentRepository.updateInvoiceStatusForOrganization(
        tx,
        organizationId,
        scopedInvoice.id,
        status,
      );

      await paymentRepository.createFinancialTransaction(tx, organizationId, {
        type: payload.amount >= 0 ? "PAYMENT" : "REFUND",
        referenceType: "payment",
        referenceId: payment.id,
        amount: Math.abs(payload.amount),
        description: `Payment for invoice ${scopedInvoice.invoiceNumber}`,
      });

      await auditService.record(
        {
          organizationId,
          userId: actorUserId,
          action: AUDIT_ACTIONS.PAYMENT_CREATED,
          entityType: AUDIT_ENTITY_TYPES.PAYMENT,
          entityId: payment.id,
          metadata: { invoiceId: scopedInvoice.id },
        },
        tx,
      );


      return payment;
    });

    return result;
  },

  listPayments: (
    organizationId: string,
    invoiceId: string | undefined,
    query: Record<string, unknown>,
  ) => {
    return paymentRepository.listPayments(organizationId, invoiceId, query);
  },

  deletePayment: async (
    organizationId: string,
    actorUserId: string,
    paymentId: string,
  ) => {
    const payment = await paymentRepository.findById(organizationId, paymentId);
    if (!payment) throw new ApiError(404, "Payment not found");

    await prisma.payment.update({
      where: { id: paymentId },
      data: { deletedAt: new Date() },
    });

    await auditService.record({
      organizationId,
      userId: actorUserId,
      action: AUDIT_ACTIONS.PAYMENT_DELETED,
      entityType: AUDIT_ENTITY_TYPES.PAYMENT,
      entityId: paymentId,
      metadata: { invoiceId: payment.invoiceId },
    });
  },
};
