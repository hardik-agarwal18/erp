"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Building2, FilePlus2, PackagePlus, UserPlus, UsersRound, X, Search } from "lucide-react";

import { useWorkspace } from "@/hooks/use-workspace";
import { useUiStore } from "@/store/ui-store";

const actions = [
  { id: "create-invoice", label: "Create Invoice", group: "Create", icon: FilePlus2 },
  { id: "create-customer", label: "Create Customer", group: "Create", icon: UsersRound },
  { id: "create-vendor", label: "Create Vendor", group: "Create", icon: UserPlus },
  { id: "add-product", label: "Add Product", group: "Create", icon: PackagePlus },
  { id: "open-reports", label: "Open Reports", group: "Navigate", icon: BarChart3 },
  { id: "switch-workspace", label: "Switch Workspace", group: "Workspace", icon: Building2 },
];

export function CommandPalette() {
  const { commandOpen, setCommandOpen } = useUiStore();
  const { workspaces } = useWorkspace();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }

      if (event.key === "Escape") {
        setCommandOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setCommandOpen]);

  // Reset query when command palette opens/closes
  useEffect(() => {
    if (!commandOpen) {
      setQuery("");
    }
  }, [commandOpen]);

  const filteredActions = useMemo(() => {
    if (!query.trim()) return actions;
    const lowerQuery = query.toLowerCase();
    return actions.filter(action => 
      action.label.toLowerCase().includes(lowerQuery) || 
      action.group.toLowerCase().includes(lowerQuery)
    );
  }, [query]);

  const grouped = useMemo(() => {
    return filteredActions.reduce<Record<string, typeof actions>>((accumulator, action) => {
      if (!accumulator[action.group]) {
        accumulator[action.group] = [];
      }
      accumulator[action.group].push(action);
      return accumulator;
    }, {});
  }, [filteredActions]);

  if (!commandOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/40 px-4 pt-24 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border bg-card text-card-foreground dark:border-slate-800 dark:bg-slate-950 shadow-2xl overflow-hidden">
        <div className="flex items-center border-b border-slate-200 px-4 py-3 gap-3">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button
            aria-label="Close command palette"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900 shrink-0"
            onClick={() => setCommandOpen(false)}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {Object.keys(grouped).length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-8">No results found.</p>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{group}</p>
                <div className="grid gap-2">
                  {items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        className="flex items-center justify-between rounded-xl border border-transparent px-3 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-slate-200 transition-colors"
                        type="button"
                        onClick={() => {
                          setCommandOpen(false);
                          // Routing logic would go here depending on the command
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium text-slate-950 dark:text-white">{item.label}</span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {item.id === "switch-workspace" ? `${workspaces.length} workspaces` : "Enter"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
