import prisma from "../../../config/database.js";
import ApiError from "../../../utils/ApiError.js";
import { workflowService } from "../../../infrastructure/workflow/workflow.service.js";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES, auditService } from "../../../services/audit/index.js";
import { invoiceQueryService } from "../../financials/invoices/invoice.query-service.js";
import { salesOrderQueryService } from "../../sales/orders/sales-order.query-service.js";
import { advanceQueryService } from "../../financials/treasury/advances/advance.query-service.js";

export const creditService = {
  /**
   * Calculates the real-time credit exposure for a customer.
   * Exposure = Open Invoices + Approved Orders Not Invoiced - Unapplied Customer Advances
   */
  calculateExposure: async (organizationId: string, customerId: string) => {
    const openInvoicesAmount = await invoiceQueryService.getOpenAmountDueForCustomer(organizationId, customerId);



    const openOrdersAmount = await salesOrderQueryService.getOpenOrdersTotalForCustomer(organizationId, customerId);

    const unappliedAdvancesAmount = await advanceQueryService.getUnappliedAdvancesForCustomer(organizationId, customerId);

    const totalExposure = openInvoicesAmount + openOrdersAmount - unappliedAdvancesAmount;
    const finalExposure = totalExposure > 0 ? totalExposure : 0;

    const profile = await prisma.customerCreditProfile.findUnique({ where: { customerId } });
    const creditLimit = profile ? Number(profile.creditLimit) : 0;
    const utilizationPercentage = creditLimit > 0 ? (finalExposure / creditLimit) * 100 : 0;

    return {
      openInvoices: openInvoicesAmount,
      openOrders: openOrdersAmount,
      unappliedAdvances: unappliedAdvancesAmount,
      totalExposure: finalExposure,
      creditLimit,
      utilizationPercentage
    };
  },

  /**
   * Requests a credit limit increase. If conditions match, it triggers a workflow.
   */
  requestCreditLimitUpdate: async (
    organizationId: string,
    actorUserId: string,
    customerId: string,
    newLimit: number,
    newDays: number,
    reason?: string
  ) => {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId, organizationId },
      include: { creditProfile: true }
    });

    if (!customer) throw new ApiError(404, "Customer not found");

    const currentLimit = Number(customer.creditProfile?.creditLimit ?? 0);

    // Check if workflow applies
    const workflowInstance = await workflowService.startWorkflow({
      organizationId,
      entityType: "CREDIT_PROFILE" as any,
      entityId: customerId,
      payload: {
        currentLimit,
        requestedLimit: newLimit,
        increaseAmount: newLimit - currentLimit,
        reason
      }
    });

    if (!workflowInstance) {
      // Auto-approve
      return await creditService.applyCreditLimitUpdate(organizationId, actorUserId, customerId, newLimit, newDays);
    }

    return {
      message: "Credit limit update requires approval",
      workflowInstanceId: workflowInstance.id
    };
  },

  applyCreditLimitUpdate: async (
    organizationId: string,
    actorUserId: string,
    customerId: string,
    creditLimit: number,
    creditDays: number
  ) => {
    const profile = await prisma.customerCreditProfile.upsert({
      where: { customerId },
      create: {
        customerId,
        creditLimit,
        creditDays
      } as any,
      update: {
        creditLimit,
        creditDays
      } as any
    });

    await auditService.record({
      organizationId,
      userId: actorUserId,
      action: "CREDIT_LIMIT_UPDATED",
      entityType: AUDIT_ENTITY_TYPES.CUSTOMER,
      entityId: customerId,
      metadata: { creditLimit, creditDays }
    });

    return profile;
  }
};
