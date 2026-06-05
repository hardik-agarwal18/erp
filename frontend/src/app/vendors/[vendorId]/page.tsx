import { AppShell } from "@/components/layout/app-shell";
import { VendorDetailsView } from "@/features/vendors/components/vendor-details-view";

export default async function VendorDetailsPage({ params }: { params: Promise<{ vendorId: string }> }) {
  const { vendorId } = await params;

  return (
    <AppShell activePath="/vendors">
      <VendorDetailsView vendorId={vendorId} />
    </AppShell>
  );
}
