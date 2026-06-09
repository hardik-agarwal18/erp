"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/hooks/use-workspace";

export function WorkspaceSwitcher() {
  const { workspace, workspaces, setWorkspaceById } = useWorkspace();
  const [open, setOpen] = useState(false);
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

  const avatarText = workspace?.companyName
    ? workspace.companyName.substring(0, 2).toUpperCase()
    : "WS";

  return (
    <div className="relative" ref={ref}>
      <div 
        className="flex items-center gap-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors px-1.5 py-1 cursor-pointer"
        onClick={() => setOpen(!open)}
        role="button"
        tabIndex={0}
      >
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded shadow-sm bg-gradient-to-tr from-slate-800 to-slate-950 text-[10px] font-bold text-white">
          {avatarText}
        </div>
        
        <div className="flex items-center gap-1 min-w-0 group">
          <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white truncate">
            {workspace.companyName}
          </span>
          <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>

        <Badge variant="secondary" className="hidden lg:inline-flex text-[9px] uppercase tracking-wider px-1.5 py-0.5 h-auto leading-none opacity-80">
          {workspace.role.replace("_", " ")}
        </Badge>
      </div>

      {open && (
        <div className="absolute top-full right-0 mt-1.5 w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-1.5 shadow-xl z-50">
          <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Switch Workspace
          </div>
          {workspaces.map((item) => (
            <button
              key={item.id}
              className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors ${
                workspace.id === item.id 
                  ? 'bg-slate-50 dark:bg-slate-900' 
                  : 'hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
              onClick={() => {
                setWorkspaceById(item.id);
                setOpen(false);
              }}
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded shadow-sm text-[10px] font-bold ${
                workspace.id === item.id 
                  ? 'bg-gradient-to-tr from-blue-600 to-blue-800 text-white' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}>
                {item.companyName.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className={`truncate text-sm ${workspace.id === item.id ? 'font-semibold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                  {item.companyName}
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wide truncate">
                  {item.role.replace("_", " ")}
                </span>
              </div>
              {workspace.id === item.id && (
                <Check className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
