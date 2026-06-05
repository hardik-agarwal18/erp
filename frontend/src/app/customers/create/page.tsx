import { AppShell } from "@/components/layout/app-shell";
import { CustomerCreateView } from "@/features/customers/components/customer-create-view";

export default function CustomerCreatePage() {
  return (
    <AppShell activePath="/customers">
      <CustomerCreateView />
    </AppShell>
  );
}
