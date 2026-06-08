import { AppShell } from "@/components/layout/app-shell";
import { VendorEditView } from "@/features/vendors/components/vendor-edit-view";

export default async function VendorEditPage({ params }: { params: Promise<{ vendorId: string }> }) {
  const { vendorId } = await params;

  return (
    <AppShell activePath="/vendors">
      <VendorEditView vendorId={vendorId} />
    </AppShell>
  );
}
