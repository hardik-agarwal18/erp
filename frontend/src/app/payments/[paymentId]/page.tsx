import { AppShell } from "@/components/layout/app-shell";
import { PaymentDetailsView } from "@/features/payments/components/payment-details-view";
import { use } from "react";

export default function PaymentDetailsPage({ params }: { params: Promise<{ paymentId: string }> }) {
  const resolvedParams = use(params);

  return (
    <AppShell activePath="/payments">
      <PaymentDetailsView paymentId={resolvedParams.paymentId} />
    </AppShell>
  );
}
