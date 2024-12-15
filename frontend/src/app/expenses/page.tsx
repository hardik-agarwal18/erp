import { AppShell } from "@/components/layout/app-shell";
import { ExpensesView } from "@/features/expenses/components/expenses-view";

export default function ExpensesPage() {
  return (
    <AppShell activePath="/expenses">
      <ExpensesView />
    </AppShell>
  );
}
