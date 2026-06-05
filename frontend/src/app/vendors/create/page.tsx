import { AppShell } from "@/components/layout/app-shell";
import { VendorCreateView } from "@/features/vendors/components/vendor-create-view";

export default function VendorCreatePage() {
  return (
    <AppShell activePath="/vendors">
      <VendorCreateView />
    </AppShell>
  );
}
