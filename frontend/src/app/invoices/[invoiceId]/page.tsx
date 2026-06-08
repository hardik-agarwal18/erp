import { AppShell } from "@/components/layout/app-shell";
import { InvoiceDetailsView } from "@/features/invoices/components/invoice-details-view";

export default async function InvoiceDetailsPage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params;

  return (
    <AppShell activePath="/invoices">
      <InvoiceDetailsView invoiceId={invoiceId} />
    </AppShell>
  );
}
