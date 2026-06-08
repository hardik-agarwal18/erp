import { AppShell } from "@/components/layout/app-shell";
import { PurchaseDetailsView } from "@/features/purchases/components/purchase-details-view";

export default async function PurchaseDetailsPage({ params }: { params: Promise<{ purchaseId: string }> }) {
  const { purchaseId } = await params;

  return (
    <AppShell activePath="/purchases">
      <PurchaseDetailsView purchaseId={purchaseId} />
    </AppShell>
  );
}
