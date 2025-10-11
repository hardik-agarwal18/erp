"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ModuleError } from "@/components/states/module-error";
import { PageLoader } from "@/components/states/page-loader";
import { useExpense } from "../hooks/use-expense";
import { useExpenseMutations } from "../hooks/use-expense-mutations";
import { ExpenseForm } from "./expense-form";
import type { ExpenseFormSchema } from "../schema";

export function ExpenseDetailsView({ expenseId }: { expenseId: string }) {
  const router = useRouter();
  const { data: expense, isError, isLoading, refetch } = useExpense(expenseId);
  const { updateExpense } = useExpenseMutations();

  if (isLoading) {
    return <PageLoader label="Loading expense details..." />;
  }

  if (isError || !expense) {
    return <ModuleError title="Expense not found" message="This expense record may have been deleted or does not exist." retry={() => refetch()} />;
  }

  const handleUpdate = async (values: ExpenseFormSchema) => {
    await updateExpense.mutateAsync({ expenseId, data: values });
    router.push("/expenses");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={`Expense ${expense.id.slice(0, 8)}`}
        description={`Expense logged on ${expense.expenseDate}`}
      />
      
      <ExpenseForm
        defaultValues={{
          category: expense.category,
          amount: expense.amount,
          expenseDate: expense.expenseDate,
          description: expense.description || "",
          vendorId: expense.vendorId || "",
        }}
        submitLabel="Save Changes"
        description="Update the category, amount, or description."
        onSubmit={handleUpdate}
        pending={updateExpense.isPending}
      />
    </div>
  );
}
