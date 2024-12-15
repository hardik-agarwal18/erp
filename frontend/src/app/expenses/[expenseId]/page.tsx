import { AppShell } from "@/components/layout/app-shell";
import { ExpenseDetailsView } from "@/features/expenses/components/expense-details-view";
import { use } from "react";

export default function ExpenseDetailsPage({ params }: { params: Promise<{ expenseId: string }> }) {
  const resolvedParams = use(params);

  return (
    <AppShell activePath="/expenses">
      <ExpenseDetailsView expenseId={resolvedParams.expenseId} />
    </AppShell>
  );
}
