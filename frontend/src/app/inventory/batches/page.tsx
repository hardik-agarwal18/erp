"use client";

import { PageHeader } from "@/components/ui/page-header";

export default function BatchesPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader 
        title="Batch Tracking" 
        description="Manage product batches, expiration dates, and manufacturing details."
      />
      <div className="border rounded-md p-8 text-center text-muted-foreground">
        Batch tracking module is currently under development.
      </div>
    </div>
  );
}
