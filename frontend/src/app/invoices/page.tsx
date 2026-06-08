import { AppShell } from "@/components/layout/app-shell";
import { InvoicesView } from "@/features/invoices/components/invoices-view";

export default function InvoicesPage() {
  return (
    <AppShell activePath="/invoices">
      <InvoicesView />
    </AppShell>
  );
}
