"use client";

import { Search } from "lucide-react";

import { useUiStore } from "@/store/ui-store";

export function SearchBar() {
  const { setCommandOpen } = useUiStore();

  return (
    <div
      aria-label="Open search and command palette"
      className="hidden w-full max-w-xl items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left md:flex"
      onClick={() => setCommandOpen(true)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setCommandOpen(true);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <Search className="h-4 w-4 text-slate-400" />
      <span className="text-sm text-slate-500">Search invoices, vendors, products, reports...</span>
      <div className="ml-auto rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-500">
        Ctrl K
      </div>
    </div>
  );
}
