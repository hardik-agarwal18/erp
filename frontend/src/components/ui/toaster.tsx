"use client";

import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className={cn("pointer-events-auto w-full max-w-sm rounded-lg border p-4 shadow-lg animate-in slide-in-from-bottom-5", 
          t.variant === "destructive" ? "bg-rose-100 border-rose-200 text-rose-900" : 
          t.variant === "success" ? "bg-emerald-100 border-emerald-200 text-emerald-900" : 
          "bg-white border-slate-200 text-slate-900"
        )}>
          <div className="font-semibold text-sm">{t.title}</div>
          {t.description && <div className="text-sm opacity-90 mt-1">{t.description}</div>}
        </div>
      ))}
    </div>
  );
}
