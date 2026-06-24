import prisma from "../../../config/database.js";
import { creditService } from "../../contacts/customers/credit.service.js";
import { invoiceQueryService } from "../invoices/invoice.query-service.js";

export const collectionsService = {
  getArAgingSummary: async (organizationId: string) => {
    // We group amountDue into buckets: 0-30, 31-60, 61-90, 90+ days past due.
    const invoices = await invoiceQueryService.getOpenInvoicesForAging(organizationId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const summary: Record<
      string,
      {
        customerId: string;
        customerName: string;
        current: number;
        days1To30: number;
        days31To60: number;
        days61To90: number;
        daysOver90: number;
        totalDue: number;
      }
    > = {};

    for (const invoice of invoices) {
      if (!summary[(invoice as any).customerId]) {
        summary[(invoice as any).customerId] = {
          customerId: (invoice as any).customerId,
          customerName: (invoice as any).customer.name,
          current: 0,
          days1To30: 0,
          days31To60: 0,
          days61To90: 0,
          daysOver90: 0,
          totalDue: 0,
        };
      }

      const due = Number((invoice as any).amountDue);
      summary[(invoice as any).customerId].totalDue += due;

      if (!invoice.dueDate || invoice.dueDate >= today) {
        summary[invoice.customerId].current += due;
      } else {
        const diffTime = Math.abs(today.getTime() - invoice.dueDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 30) summary[invoice.customerId].days1To30 += due;
        else if (diffDays <= 60) summary[invoice.customerId].days31To60 += due;
        else if (diffDays <= 90) summary[invoice.customerId].days61To90 += due;
        else summary[invoice.customerId].daysOver90 += due;
      }
    }

    return Object.values(summary);
  },

  flagHighRiskAccounts: async (organizationId: string) => {
    const aging = await collectionsService.getArAgingSummary(organizationId);
    const flags = [];

    for (const record of aging) {
      // Rule 1: More than 30% of total due is > 90 days overdue
      if (record.daysOver90 > 0 && record.daysOver90 / record.totalDue > 0.3) {
        flags.push({
          customerId: record.customerId,
          reason: ">30% of AR is over 90 days past due",
          action: "HOLD_CREDIT",
        });
      }

      // Check credit utilization via credit engine
      const exposure = await creditService.calculateExposure(organizationId, record.customerId);
      const limit = Number(exposure.creditLimit);
      
      // Rule 2: Utilized > 90% of credit limit
      if (limit > 0 && exposure.utilizationPercentage > 90) {
        flags.push({
          customerId: record.customerId,
          reason: `Credit utilization is ${exposure.utilizationPercentage}%`,
          action: "WARNING",
        });
      }
    }

    return flags;
  },
};
