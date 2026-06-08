import { AppShell } from "@/components/layout/app-shell";
import { InvoiceEditView } from "@/features/invoices/components/invoice-edit-view";

export default async function InvoiceEditPage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params;

  return (
    <AppShell activePath="/invoices">
      <InvoiceEditView invoiceId={invoiceId} />
    </AppShell>
  );
}
