import { AppShell } from "@/components/layout/app-shell";
import { TransactionDashboardView } from "@/features/transactions/components/transaction-dashboard-view";

export default function TransactionsPage() {
  return (
    <AppShell activePath="/transactions">
      <TransactionDashboardView />
    </AppShell>
  );
}
