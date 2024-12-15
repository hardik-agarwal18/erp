import { AppShell } from "@/components/layout/app-shell";
import { ExpenseCreateView } from "@/features/expenses/components/expense-create-view";

export default function ExpenseCreatePage() {
  return (
    <AppShell activePath="/expenses">
      <ExpenseCreateView />
    </AppShell>
  );
}
