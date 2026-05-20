"use client";

import { Building2, ChevronDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { useWorkspace } from "@/hooks/use-workspace";

export function WorkspaceSwitcher() {
  const { workspace, workspaces, setWorkspaceById } = useWorkspace();

  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white">
        <Building2 className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Workspace</p>
        <div className="flex items-center gap-2">
          <Select
            aria-label="Switch workspace"
            className="h-auto border-0 bg-transparent p-0 pr-6 text-sm font-semibold text-slate-950 focus:border-0"
            value={workspace.id}
            onChange={(event) => setWorkspaceById(event.target.value)}
          >
            {workspaces.map((item) => (
              <option key={item.id} value={item.id}>
                {item.companyName}
              </option>
            ))}
          </Select>
          <ChevronDown className="pointer-events-none -ml-6 h-4 w-4 text-slate-400" />
        </div>
      </div>
      <Badge variant="info" className="hidden lg:inline-flex">
        {workspace.role.replace("_", " ")}
      </Badge>
    </div>
  );
}
