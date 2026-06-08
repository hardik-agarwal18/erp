import { FileText, MessageSquareText, ReceiptText, Wallet } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CustomerTimelineEntry } from "@/types/app";

const iconMap = {
  invoice: ReceiptText,
  payment: Wallet,
  note: MessageSquareText,
  document: FileText,
  credit: Wallet,
};

export function CustomerTimeline({ timeline }: { timeline: CustomerTimelineEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Customer Timeline</CardTitle>
          <CardDescription>Collections, invoicing, credit, and document activity.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {timeline.map((entry) => {
          const Icon = iconMap[entry.kind];
          return (
            <div key={entry.id} className="flex gap-3 rounded-lg border border-slate-200 p-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-950">{entry.title}</p>
                  <span className="text-xs text-slate-400">{entry.occurredAt}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{entry.detail}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
