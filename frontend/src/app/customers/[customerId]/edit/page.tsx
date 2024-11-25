import { AppShell } from "@/components/layout/app-shell";
import { CustomerEditView } from "@/features/customers/components/customer-edit-view";

export default async function CustomerEditPage({ params }: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await params;

  return (
    <AppShell activePath="/customers">
      <CustomerEditView customerId={customerId} />
    </AppShell>
  );
}
