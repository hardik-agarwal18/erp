import { AppShell } from "@/components/layout/app-shell";
import { BankReconciliationView } from "@/features/transactions/components/bank-reconciliation-view";

export default function TransactionReconciliationPage() {
  return (
    <AppShell activePath="/transactions">
      <BankReconciliationView />
    </AppShell>
  );
}
