import { AppShell } from "@/components/layout/app-shell";
import { PaymentsView } from "@/features/payments/components/payments-view";

export default function PaymentsPage() {
  return (
    <AppShell activePath="/payments">
      <PaymentsView />
    </AppShell>
  );
}
