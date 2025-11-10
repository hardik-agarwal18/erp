"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 max-w-full">
      <PageHeader
        title="Precision Ledger Dashboard"
        description="Stitch-guided executive overview for accounting, receivables, cash, and stock exposure."
        actions={
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        }
      />

      {/* KPIs: Top Row */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px] w-full rounded-xl" />
        ))}
      </div>

      {/* Trends: Second Row */}
      <div className="grid gap-4 grid-cols-1 xl:grid-cols-2">
        <Skeleton className="h-[360px] w-full rounded-xl" />
        <Skeleton className="h-[360px] w-full rounded-xl" />
      </div>

      {/* Operational Awareness: Third Row */}
      <div className="grid gap-4 grid-cols-1 xl:grid-cols-2">
        <Skeleton className="h-[300px] w-full rounded-xl" />
        <Skeleton className="h-[300px] w-full rounded-xl" />
      </div>

      {/* Operational Summaries: Fourth Row */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Skeleton className="h-[280px] w-full rounded-xl" />
        <Skeleton className="h-[280px] w-full rounded-xl" />
        <Skeleton className="h-[280px] w-full rounded-xl" />
      </div>
    </div>
  );
}
