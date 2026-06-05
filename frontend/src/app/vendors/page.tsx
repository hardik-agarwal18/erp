import { AppShell } from "@/components/layout/app-shell";
import { VendorListView } from "@/features/vendors/components/vendor-list-view";

export default function VendorsPage() {
  return (
    <AppShell activePath="/vendors">
      <VendorListView />
    </AppShell>
  );
}
