import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Customer } from "@/types/app";
import { formatCurrency } from "@/utils/formatters";

export function CustomerProfile({ customer }: { customer: Customer }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{customer.name}</CardTitle>
          <CardDescription>{customer.legalName}</CardDescription>
        </div>
        <Badge variant={customer.status === "active" ? "success" : customer.status === "at_risk" ? "warning" : "neutral"}>
          {customer.status.replace("_", " ")}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-2">
          <ProfileField label="Customer Code" value={customer.code} />
          <ProfileField label="Owner" value={customer.owner} />
          <ProfileField label="Email" value={customer.email} />
          <ProfileField label="Phone" value={customer.phone} />
          <ProfileField label="Segment" value={customer.segment.replace("_", " ")} />
          <ProfileField label="Payment Terms" value={customer.paymentTerms ? `${customer.paymentTerms} Days` : "Due on receipt"} />
          <ProfileField label="Credit Limit" value={formatCurrency(customer.creditLimit)} />
          <ProfileField label="Outstanding Balance" value={formatCurrency(customer.outstandingBalance)} />
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <ProfileField label="Billing Address" value={customer.billingAddress} />
          <ProfileField label="Shipping Address" value={customer.shippingAddress} />
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
