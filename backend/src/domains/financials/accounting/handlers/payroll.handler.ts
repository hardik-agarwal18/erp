import { accountingRepository } from "../accounting.repository.js";
import { CreateJournalEntryInput } from "../accounting.types.js";
import prisma from "../../../../config/database.js";

export const payrollAccountingHandler = {
  async handle(organizationId: string, event: any) {
    const { payrollRunId } = event.payload;

    const payrollRun = await prisma.payrollRun.findUnique({
      where: { id: payrollRunId },
      include: {
        employees: true
      }
    });

    if (!payrollRun) {
      throw new Error(`PayrollRun ${payrollRunId} not found`);
    }

    const amount = Number((payrollRun as any).totalAmount) || 0;

    const entryDto: any = {
      organizationId,
      description: `Salary Expense for Payroll Run ${payrollRunId}`,
      referenceType: "PayrollRun",
      referenceId: payrollRun.id,
      sourceEventId: event.id, // For idempotency
      lines: [
        {
          accountId: "account-salary-expense", // Typically would be resolved dynamically
          debit: Number(amount),
          type: "DEBIT",
          description: "Salary Expense"
        } as any,
        {
          accountId: "account-payroll-liability", // Typically would be resolved dynamically
          credit: Number(amount),
          type: "CREDIT",
          description: "Payroll Payable"
        } as any
      ]
    };

    await (accountingRepository as any).createJournalEntry(entryDto as any);
  }
};
