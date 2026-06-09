"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle2, Package, ReceiptText, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        className="relative flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:ring-2 hover:ring-slate-100 dark:hover:ring-slate-800 transition-all focus:outline-none"
        onClick={() => setOpen((value) => !value)}
        type="button"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white dark:border-slate-950 bg-rose-500 px-1 text-[9px] font-bold text-white shadow-sm">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[340px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-1 shadow-xl">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100 dark:border-slate-800/60 mb-1">
            <div>
              <p className="text-[13px] font-semibold text-slate-900 dark:text-white leading-none mb-1">Notifications</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">System Alerts</p>
            </div>
            <Badge variant="warning" className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 h-auto leading-none bg-amber-100 text-amber-700 border-amber-200 shadow-none">
              {unreadCount} new
            </Badge>
          </div>

          <div className="max-h-[300px] overflow-y-auto p-1 space-y-1">
            {notifications.map((notification) => {
              const Icon = notification.icon;

              return (
                <div key={notification.id} className="rounded-lg border border-transparent hover:border-slate-100 dark:hover:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors p-2 cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm",
                        notification.tone === "danger" && "bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400",
                        notification.tone === "warning" && "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
                        notification.tone === "success" && "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 leading-tight mb-0.5">{notification.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{notification.detail}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800/60 p-1 mt-1">
            <button 
              className="flex w-full items-center justify-center gap-2 rounded-lg px-2.5 py-2 text-[12px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors" 
              type="button"
              onClick={() => {
                setOpen(false);
                router.push('/audit-logs');
              }}
            >
              <TriangleAlert className="h-3.5 w-3.5 text-slate-400" />
              View all alerts
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
