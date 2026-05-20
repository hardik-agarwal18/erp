"use client";

import { useMemo, useState } from "react";
import { Bell, CheckCircle2, Package, ReceiptText, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const notifications = [
  {
    id: "note-1",
    title: "Invoice INV-4021 is overdue",
    detail: "Collections follow-up required today.",
    tone: "danger" as const,
    icon: ReceiptText,
  },
  {
    id: "note-2",
    title: "Circuit board stock below threshold",
    detail: "Assembly warehouse has only 12 units left.",
    tone: "warning" as const,
    icon: Package,
  },
  {
    id: "note-3",
    title: "Month-end close checklist ready",
    detail: "Finance operations can begin reconciliation.",
    tone: "success" as const,
    icon: CheckCircle2,
  },
];

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const unreadCount = useMemo(() => notifications.length, []);

  return (
    <div className="relative">
      <Button aria-expanded={open} aria-haspopup="dialog" size="icon" variant="outline" onClick={() => setOpen((value) => !value)}>
        <Bell className="h-4 w-4" />
      </Button>
      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
          {unreadCount}
        </span>
      ) : null}

      {open ? (
        <div className="absolute right-0 z-40 mt-3 w-[360px] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">Notifications</p>
              <p className="text-xs text-slate-500">Cross-workspace alerts and approvals</p>
            </div>
            <Badge variant="warning">{unreadCount} new</Badge>
          </div>

          <div className="mt-4 space-y-3">
            {notifications.map((notification) => {
              const Icon = notification.icon;

              return (
                <div key={notification.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "mt-0.5 flex h-9 w-9 items-center justify-center rounded-full",
                        notification.tone === "danger" && "bg-rose-100 text-rose-700",
                        notification.tone === "warning" && "bg-amber-100 text-amber-700",
                        notification.tone === "success" && "bg-emerald-100 text-emerald-700",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-950">{notification.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{notification.detail}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-950" type="button">
            <TriangleAlert className="h-4 w-4" />
            View all alerts
          </button>
        </div>
      ) : null}
    </div>
  );
}
