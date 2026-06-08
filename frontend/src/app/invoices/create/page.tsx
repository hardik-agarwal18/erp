import { AppShell } from "@/components/layout/app-shell";
import { InvoiceCreateView } from "@/features/invoices/components/invoice-create-view";

export default function InvoiceCreatePage() {
  return (
    <AppShell activePath="/invoices">
      <InvoiceCreateView />
    </AppShell>
  );
}
