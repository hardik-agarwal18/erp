
import { Prisma } from "@prisma/client";

import prisma, {
  type DatabaseTransactionClient,
} from "../../../config/database.js";
import { parsePagination } from "../../../shared/utils/pagination.js";
import { CreatePaymentInput } from "./payment.types.js";

type DatabaseClient = DatabaseTransactionClient | typeof prisma;

const getClient = (client?: DatabaseClient): DatabaseClient => client ?? prisma;

export const paymentRepository = {
  createPayment: (organizationId: string, payload: CreatePaymentInput) => {
    return prisma.payment.create({
      data: {
        organizationId,
        invoiceId: payload.invoiceId,
        amount: payload.amount,
        paymentMethod: payload.paymentMethod,
        paymentDate: new Date(payload.paymentDate),
        reference: payload.reference,
        bankAccountId: payload.bankAccountId,
      },
    });
  },
  listPayments: (
    organizationId: string,
    invoiceId: string | undefined,
    query: Record<string, unknown>,
  ) => {
    const pagination = parsePagination(query);
    const where = {
      organizationId,
      deletedAt: null,
      ...(invoiceId ? { invoiceId } : {}),
    };

    return prisma
      .$transaction([
        prisma.payment.findMany({
          where,
          orderBy: { paymentDate: "desc" },
          skip: pagination.skip,
          take: pagination.take,
          include: { invoice: true },
        }),
        prisma.payment.count({ where }),
      ])
      .then(([items, total]) => ({
        items,
        total,
        page: pagination.page,
        limit: pagination.limit,
      }));
  },
  findInvoice: (organizationId: string, invoiceId: string) => {
    return prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId, deletedAt: null },
    });
  },
  findById: (organizationId: string, paymentId: string) => {
    return prisma.payment.findFirst({
      where: { id: paymentId, organizationId, deletedAt: null },
    });
  },
  findInvoiceById: (
    organizationId: string,
    invoiceId: string,
    client?: DatabaseClient,
  ) => {
    return getClient(client).invoice.findFirst({
      where: { id: invoiceId, organizationId, deletedAt: null },
    });
  },
  createPaymentForOrganization: (
    tx: DatabaseTransactionClient,
    organizationId: string,
    payload: CreatePaymentInput,
  ) => {
    return tx.payment.create({
      data: {
        organizationId,
        invoiceId: payload.invoiceId,
        amount: payload.amount,
        paymentMethod: payload.paymentMethod,
        paymentDate: new Date(payload.paymentDate),
        reference: payload.reference,
        bankAccountId: payload.bankAccountId,
      },
    });
  },
  sumPaymentsForInvoice: (
    tx: DatabaseTransactionClient,
    organizationId: string,
    invoiceId: string,
  ) => {
    return tx.payment.aggregate({
      where: {
        organizationId,
        invoiceId,
        deletedAt: null,
      },
      _sum: { amount: true },
    });
  },
  updateInvoiceStatusForOrganization: (
    tx: DatabaseTransactionClient,
    organizationId: string,
    invoiceId: string,
    status: "ISSUED" | "PARTIALLY_PAID" | "PAID",
  ) => {
    return tx.invoice.updateMany({
      where: {
        id: invoiceId,
        organizationId,
        deletedAt: null,
      },
      data: { status },
    });
  },
  createFinancialTransaction: (
    tx: DatabaseTransactionClient,
    organizationId: string,
    payload: {
      type: "PAYMENT" | "REFUND";
      referenceType: string;
      referenceId: string;
      amount: number;
      description: string;
    },
  ) => {
    return tx.transaction.create({
      data: {
        organizationId,
        type: payload.type,
        referenceType: payload.referenceType,
        referenceId: payload.referenceId,
        amount: payload.amount,
        description: payload.description,
      },
    });
  },
};
