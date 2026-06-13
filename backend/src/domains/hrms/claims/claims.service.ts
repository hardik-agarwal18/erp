import { prisma } from "../../../config/database.js";
import { ExpenseClaimStatus } from "./claims.validators.js";

export const claimsService = {
  submitClaim: async (organizationId: string, employeeId: string, data: {
    date: string;
    category: string;
    amount: number;
    currency?: string;
    description?: string;
    receiptUrl?: string;
  }) => {
    return prisma.expenseClaim.create({
      data: {
        organizationId,
        employeeId,
        date: new Date(data.date),
        category: data.category,
        amount: data.amount,
        currency: data.currency || "USD",
        description: data.description,
        receiptUrl: data.receiptUrl,
        status: ExpenseClaimStatus.PENDING,
      },
      include: {
        employee: { select: { firstName: true, lastName: true, employeeCode: true } }
      }
    });
  },

  listClaims: async (organizationId: string, employeeId?: string, status?: ExpenseClaimStatus) => {
    return prisma.expenseClaim.findMany({
      where: {
        organizationId,
        ...(employeeId ? { employeeId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        employee: { select: { firstName: true, lastName: true, employeeCode: true, profileImageUrl: true } },
        approvedBy: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" },
    });
  },

  getClaim: async (id: string, organizationId: string) => {
    return prisma.expenseClaim.findUnique({
      where: { id, organizationId },
      include: {
        employee: { select: { firstName: true, lastName: true, employeeCode: true, profileImageUrl: true } },
        approvedBy: { select: { name: true } }
      }
    });
  },

  updateStatus: async (id: string, organizationId: string, approvedById: string, status: ExpenseClaimStatus) => {
    return prisma.expenseClaim.update({
      where: { id, organizationId },
      data: {
        status,
        ...(status === "APPROVED" || status === "REJECTED" ? { approvedById } : {}),
        ...(status === "REIMBURSED" ? { reimbursedAt: new Date() } : {})
      },
      include: {
        employee: { select: { firstName: true, lastName: true, employeeCode: true } },
        approvedBy: { select: { name: true } }
      }
    });
  }
};

