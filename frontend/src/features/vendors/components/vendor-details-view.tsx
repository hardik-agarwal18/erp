"use client";

import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";

import { EmptyState } from "@/components/states/empty-state";
import { ModuleError } from "@/components/states/module-error";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";
import { useVendorDetailQuery } from "../hooks/use-vendors-query";
import { VendorDocuments } from "./vendor-documents";
import { VendorProfile } from "./vendor-profile";
import { VendorPurchaseOrders } from "./vendor-purchase-orders";
import { VendorSummaryCard } from "./vendor-summary-card";
import { VendorTimeline } from "./vendor-timeline";
import { VendorTransactions } from "./vendor-transactions";

export function VendorDetailsView({ vendorId }: { vendorId: string }) {
  const query = useVendorDetailQuery(vendorId);

  if (query.isError) {
    return <ModuleError title="Vendor unavailable" message="We could not load the selected vendor profile." retry={() => query.refetch()} />;
  }

  if (!query.data) {
    return <EmptyState title="Vendor not found" description="The requested vendor could not be located in this workspace." actionLabel="Back to vendors" />;
  }

  const vendor = query.data;

  return (
    <div className="space-y-5">
      <PageHeader
        title={vendor.name}
        description={`Vendor profile, procurement history, and AP controls for ${vendor.code}.`}
        actions={
          <>
            <Button asChild size="sm" variant="outline">
              <Link href="/vendors">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/vendors/${vendor.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Vendor
              </Link>
            </Button>
          </>
        }
      />

      <section className="grid gap-4 xl:grid-cols-4">
        <VendorSummaryCard label="Outstanding" value={formatCurrency(vendor.outstandingBalance)} detail="Open payable balance" />
        <VendorSummaryCard label="Lead Time" value={`${vendor.leadTimeDays} days`} detail="Expected sourcing lead time" />
        <VendorSummaryCard label="Total Spend" value={formatCurrency(vendor.totalSpend)} detail="Lifetime billed spend" />
        <VendorSummaryCard label="Last Bill" value={vendor.lastBillDate} detail="Most recent AP posting date" />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.82fr)]">
        <div className="space-y-4">
          <VendorProfile vendor={vendor} />
          <VendorPurchaseOrders orders={vendor.purchaseOrders} />
          <VendorTransactions transactions={vendor.transactions} />
        </div>
        <div className="space-y-4">
          <VendorTimeline timeline={vendor.timeline} />
          <VendorDocuments documents={vendor.documents} />
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-slate-950">Vendor Controls</p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="rounded-lg border border-slate-200 p-3">Account manager: {vendor.accountManager}</div>
                <div className="rounded-lg border border-slate-200 p-3">Currency: {vendor.currency}</div>
                <div className="rounded-lg border border-slate-200 p-3">Tax ID: {vendor.gstin}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
