"use client";

import { Bell, Search } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useWorkspace } from "@/hooks/use-workspace";

export function Topbar() {
  const { workspace, workspaces, setWorkspaceById, session } = useWorkspace();

  return (
    <header className="flex h-[72px] items-center justify-between gap-4 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950/90 px-5 backdrop-blur">
      <div className="flex items-center gap-3">
        <Select className="w-[220px]" value={workspace.id} onChange={(event) => setWorkspaceById(event.target.value)}>
          {workspaces.map((item) => (
            <option key={item.id} value={item.id}>
              {item.companyName}
            </option>
          ))}
        </Select>
        <Badge variant="info">{workspace.role.replace("_", " ")}</Badge>
      </div>

      <div className="flex flex-1 items-center justify-end gap-3">
        <div className="hidden w-full max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 md:flex">
          <Search className="h-4 w-4 text-slate-400" />
          <Input className="border-0 bg-transparent px-0 focus:border-0" placeholder="Search invoices, vendors, items..." />
        </div>
        <Button size="icon" variant="outline">
          <Bell className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3 rounded-xl border bg-card text-card-foreground dark:border-slate-800 dark:bg-slate-950 px-3 py-2">
          <Avatar>
            <AvatarFallback>{session.initials}</AvatarFallback>
          </Avatar>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-semibold text-slate-950">{session.name}</p>
            <p className="text-xs text-slate-500">{session.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
