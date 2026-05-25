import { Card, CardContent } from "@/components/ui/card";

export function VendorSummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
        <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
        {detail ? <p className="mt-2 text-sm text-slate-500">{detail}</p> : null}
      </CardContent>
    </Card>
  );
}
