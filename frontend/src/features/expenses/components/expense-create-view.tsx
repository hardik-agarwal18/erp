"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { useExpenseMutations } from "../hooks/use-expense-mutations";
import { ExpenseForm } from "./expense-form";
import type { ExpenseFormSchema } from "../schema";

export function ExpenseCreateView() {
  const router = useRouter();
  const { createExpense } = useExpenseMutations();

  const handleCreate = async (values: ExpenseFormSchema) => {
    await createExpense.mutateAsync(values);
    router.push("/expenses");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Create Expense"
        description="Log a new operating expense or overhead cost."
      />
      
      <ExpenseForm
        defaultValues={{
          category: "OTHER",
          amount: 0,
          expenseDate: new Date().toISOString().slice(0, 10),
          description: "",
          vendorId: "",
        }}
        submitLabel="Create Expense"
        description="Provide the details of the expense and assign it to a category."
        onSubmit={handleCreate}
        pending={createExpense.isPending}
      />
    </div>
  );
}
