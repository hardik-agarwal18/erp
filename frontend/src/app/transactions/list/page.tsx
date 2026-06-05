import { AppShell } from "@/components/layout/app-shell";
import { TransactionListView } from "@/features/transactions/components/transaction-list-view";

export default function TransactionsListPage() {
  return (
    <AppShell activePath="/transactions">
      <TransactionListView />
    </AppShell>
  );
}
