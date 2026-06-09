"use client";

import { Search } from "lucide-react";

import { useUiStore } from "@/store/ui-store";

export function SearchBar() {
  const { setCommandOpen } = useUiStore();

  return (
    <div
      aria-label="Open search and command palette"
      className="hidden w-full max-w-md items-center gap-2 rounded-md bg-slate-100/80 dark:bg-slate-800/50 hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:ring-4 hover:ring-slate-100 dark:hover:ring-slate-800/50 transition-all px-2.5 py-1.5 text-left md:flex cursor-text border border-transparent hover:border-slate-300/50 dark:hover:border-slate-700"
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
      <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      <span className="text-[13px] text-slate-500 truncate flex-1 font-medium">Search or jump to...</span>
      <div className="ml-auto shrink-0 rounded bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-slate-400 shadow-sm">
        ⌘K
      </div>
    </div>
  );
}
