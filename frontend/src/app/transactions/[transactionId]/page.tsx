import { AppShell } from "@/components/layout/app-shell";
import { TransactionDetailsView } from "@/features/transactions/components/transaction-details-view";

export default async function TransactionDetailsPage({ params }: { params: Promise<{ transactionId: string }> }) {
  const { transactionId } = await params;

  return (
    <AppShell activePath="/transactions">
      <TransactionDetailsView transactionId={transactionId} />
    </AppShell>
  );
}
