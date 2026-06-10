import { Inbox } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function EmptyState({
  title,
  description,
  actionLabel,
  actionUrl,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionUrl?: string;
}) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-600">
        <Inbox className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>
      {actionLabel && actionUrl ? (
        <Button asChild className="mt-4" variant="outline">
          <Link href={actionUrl}>{actionLabel}</Link>
        </Button>
      ) : actionLabel ? (
        <Button className="mt-4" variant="outline">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
