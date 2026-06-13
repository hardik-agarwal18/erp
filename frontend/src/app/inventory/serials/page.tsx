"use client";

import { PageHeader } from "@/components/ui/page-header";

export default function SerialsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader 
        title="Serial Numbers" 
        description="Track individual product serial numbers and their lifecycle."
      />
      <div className="border rounded-md p-8 text-center text-muted-foreground">
        Serial number tracking module is currently under development.
      </div>
    </div>
  );
}
