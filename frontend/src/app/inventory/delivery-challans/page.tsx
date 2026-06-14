"use client";

import { PageHeader } from "@/components/ui/page-header";

export default function DeliveryChallansPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader 
        title="Delivery Challans" 
        description="Manage outbound inventory and delivery notes."
      />
      <div className="border rounded-md p-8 text-center text-muted-foreground">
        Delivery challans module is currently under development.
      </div>
    </div>
  );
}
