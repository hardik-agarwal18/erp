import { Card, CardContent } from "@/components/ui/card";

export function PurchaseSummary({ items }: { items: Array<{ label: string; value: string; detail: string }> }) {
  return (
    <section className="grid gap-4 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
            <p className="mt-3 text-2xl font-semibold text-slate-950">{item.value}</p>
            <p className="mt-2 text-sm text-slate-500">{item.detail}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
