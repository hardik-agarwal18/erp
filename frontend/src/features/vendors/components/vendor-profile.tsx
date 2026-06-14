import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Vendor } from "@/types/app";
import { formatCurrency } from "@/utils/formatters";

export function VendorProfile({ vendor }: { vendor: Vendor }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{vendor.name}</CardTitle>
          <CardDescription>{vendor.legalName}</CardDescription>
        </div>
        <Badge variant={vendor.status === "active" ? "success" : vendor.status === "review" ? "warning" : "neutral"}>
          {vendor.status}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-2">
          <ProfileField label="Vendor Code" value={vendor.code} />
          <ProfileField label="Manager" value={vendor.accountManager} />
          <ProfileField label="Email" value={vendor.email} />
          <ProfileField label="Phone" value={vendor.phone} />
          <ProfileField label="Category" value={vendor.category.replace("_", " ")} />
          <ProfileField label="Payment Terms" value={vendor.paymentTerms ? `${vendor.paymentTerms} Days` : "Due on receipt"} />
          <ProfileField label="Lead Time" value={`${vendor.leadTimeDays} days`} />
          <ProfileField label="Outstanding Balance" value={formatCurrency(vendor.outstandingBalance)} />
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <ProfileField label="Billing Address" value={vendor.billingAddress} />
          <ProfileField label="Shipping Address" value={vendor.shippingAddress} />
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm text-slate-900">{value}</p>
    </div>
  );
}
