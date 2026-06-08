import { AppShell } from "@/components/layout/app-shell";
import { CustomerDetailsView } from "@/features/customers/components/customer-details-view";

export default async function CustomerDetailsPage({ params }: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await params;

  return (
    <AppShell activePath="/customers">
      <CustomerDetailsView customerId={customerId} />
    </AppShell>
  );
}
