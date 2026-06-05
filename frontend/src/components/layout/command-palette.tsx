"use client";

import { useEffect, useMemo } from "react";
import { BarChart3, Building2, FilePlus2, PackagePlus, UserPlus, UsersRound, X } from "lucide-react";

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

  const grouped = useMemo(() => {
    return actions.reduce<Record<string, typeof actions>>((accumulator, action) => {
      if (!accumulator[action.group]) {
        accumulator[action.group] = [];
      }
      accumulator[action.group].push(action);
      return accumulator;
    }, {});
  }, []);

  if (!commandOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/40 px-4 pt-24 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-950">Command Palette</p>
            <p className="text-xs text-slate-500">Fast creation and workspace navigation</p>
          </div>
          <button
            aria-label="Close command palette"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            onClick={() => setCommandOpen(false)}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{group}</p>
              <div className="grid gap-2">
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3 text-left hover:bg-slate-50"
                      type="button"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-slate-950">{item.label}</span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {item.id === "switch-workspace" ? `${workspaces.length} workspaces` : "Enter"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
