import type { InvoiceLineItem } from "@/types/app";
import { formatCurrency } from "@/utils/formatters";

export function InvoiceLineItems({ items, currency = "USD" }: { items: InvoiceLineItem[]; currency?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Description</th>
            <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 text-right">Qty</th>
            <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 text-right">Unit Price</th>
            <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 text-right">Tax</th>
            <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 text-right">Line Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const subtotal = item.quantity * item.unitPrice;
            const total = subtotal + subtotal * (item.taxRate / 100);

            return (
              <tr key={item.id} className="border-b border-slate-100">
                <td className="px-3 py-3 text-slate-700">{item.description}</td>
                <td className="px-3 py-3 text-right text-slate-700">{item.quantity}</td>
                <td className="px-3 py-3 text-right text-slate-700">{formatCurrency(item.unitPrice, currency)}</td>
                <td className="px-3 py-3 text-right text-slate-700">{item.taxRate}%</td>
                <td className="px-3 py-3 text-right font-medium text-slate-950">{formatCurrency(total, currency)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
