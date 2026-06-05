import prisma from "../../config/database.js";
import ApiError from "../../utils/ApiError.js";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  auditService,
} from "../../services/audit/index.js";
import { customerRepository } from "./customer.repository.js";
import {
  CreateCustomerInput,
  CustomerFilters,
  UpdateCustomerInput,
} from "./customer.types.js";

export const customerService = {
  createCustomer: async (
    organizationId: string,
    actorUserId: string,
    payload: CreateCustomerInput,
  ) => {
    const customer = await customerRepository.createCustomer(
      organizationId,
      payload,
    );
    await auditService.record({
      organizationId,
      userId: actorUserId,
      action: AUDIT_ACTIONS.CUSTOMER_CREATED,
      entityType: AUDIT_ENTITY_TYPES.CUSTOMER,
      entityId: customer.id,
    });
    return customer;
  },

  updateCustomer: async (
    organizationId: string,
    actorUserId: string,
    customerId: string,
    payload: UpdateCustomerInput,
  ) => {
    const existing = await customerRepository.findById(
      organizationId,
      customerId,
    );
    if (!existing) {
      throw new ApiError(404, "Customer not found");
    }

    const updated = await customerRepository.updateCustomer(
      organizationId,
      customerId,
      payload,
    );
    if (!updated) {
      throw new ApiError(404, "Customer not found");
    }
    await auditService.record({
      organizationId,
      userId: actorUserId,
      action: AUDIT_ACTIONS.CUSTOMER_UPDATED,
      entityType: AUDIT_ENTITY_TYPES.CUSTOMER,
      entityId: customerId,
    });
    return updated;
  },

  archiveCustomer: async (
    organizationId: string,
    actorUserId: string,
    customerId: string,
  ) => {
    const existing = await customerRepository.findById(
      organizationId,
      customerId,
    );
    if (!existing) {
      throw new ApiError(404, "Customer not found");
    }

    await customerRepository.archiveCustomer(organizationId, customerId);
    await auditService.record({
      organizationId,
      userId: actorUserId,
      action: AUDIT_ACTIONS.CUSTOMER_ARCHIVED,
      entityType: AUDIT_ENTITY_TYPES.CUSTOMER,
      entityId: customerId,
    });
  },

  listCustomers: (
    organizationId: string,
    filters: CustomerFilters,
    query: Record<string, unknown>,
  ) => {
    return customerRepository.listCustomers(organizationId, filters, query);
  },

  getLedger: async (organizationId: string, customerId: string) => {
    const customer = await customerRepository.findById(
      organizationId,
      customerId,
    );
    if (!customer) {
      throw new ApiError(404, "Customer not found");
    }

    const [invoices, payments, invoiceTotals, paymentTotals] =
      await prisma.$transaction([
        prisma.invoice.findMany({
          where: { organizationId, customerId, deletedAt: null },
          orderBy: { issueDate: "desc" },
        }),
        prisma.payment.findMany({
          where: {
            organizationId,
            invoice: { customerId },
            deletedAt: null,
          },
          orderBy: { paymentDate: "desc" },
          include: { invoice: true },
        }),
        prisma.invoice.aggregate({
          where: { organizationId, customerId, deletedAt: null },
          _sum: { totalAmount: true },
        }),
        prisma.payment.aggregate({
          where: {
            organizationId,
            invoice: { customerId },
            deletedAt: null,
          },
          _sum: { amount: true },
        }),
      ]);

    const totalInvoiced = Number(invoiceTotals._sum.totalAmount ?? 0);
    const totalPaid = Number(paymentTotals._sum.amount ?? 0);
    const outstanding = totalInvoiced - totalPaid;

    return {
      customer,
      invoices,
      payments,
      outstandingBalance: outstanding > 0 ? outstanding : 0,
      creditBalance: outstanding < 0 ? Math.abs(outstanding) : 0,
    };
  },
};
