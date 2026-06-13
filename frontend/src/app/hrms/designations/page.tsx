"use client";

import { PageHeader } from "@/components/ui/page-header";

export default function DesignationsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader 
        title="Designations" 
        description="Manage job titles and designation levels."
      />
      <div className="border rounded-md p-8 text-center text-muted-foreground">
        Designation management module is currently under development.
      </div>
    </div>
  );
}
