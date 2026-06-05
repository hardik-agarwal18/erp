import { AppShell } from "@/components/layout/app-shell";
import { CustomerListView } from "@/features/customers/components/customer-list-view";

export default function CustomersPage() {
  return (
    <AppShell activePath="/customers">
      <CustomerListView />
    </AppShell>
  );
}
