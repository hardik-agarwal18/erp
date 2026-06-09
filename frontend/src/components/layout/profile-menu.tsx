"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Settings, ShieldCheck, UserCircle2 } from "lucide-react";

import { useWorkspace } from "@/hooks/use-workspace";

export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { session, workspace, signOut } = useWorkspace();
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
        className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:ring-2 hover:ring-slate-200 dark:hover:ring-slate-700 transition-all focus:outline-none"
        onClick={() => setOpen((value) => !value)}
        type="button"
        aria-label="User menu"
      >
        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
          {session.initials}
        </span>
      </button>

      {open ? (
        <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-1 shadow-xl">
          <div className="px-2 py-3 flex flex-col items-center border-b border-slate-100 dark:border-slate-800/60 mb-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-lg font-bold shadow-sm mb-2">
              {session.initials}
            </div>
            <p className="text-[13px] font-semibold text-slate-900 dark:text-white leading-tight">
              {session.name}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {session.email}
            </p>
            {workspace?.role && (
              <span className="mt-2 inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[9px] font-medium uppercase tracking-widest text-slate-600 dark:text-slate-300">
                {workspace.role.replace("_", " ")}
              </span>
            )}
          </div>

          <div className="space-y-0.5 p-1">
            {[
              { label: "My Profile", icon: UserCircle2, href: "/settings/profile" },
              { label: "Security", icon: ShieldCheck, href: "/settings/security" },
              { label: "Preferences", icon: Settings, href: "/settings/organization" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                  onClick={() => {
                    setOpen(false);
                    router.push(item.href);
                  }}
                  type="button"
                >
                  <Icon className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-slate-500" />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800/60 p-1 mt-1">
            <button
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              onClick={async () => {
                await signOut();
                router.replace("/login");
              }}
              type="button"
            >
              <LogOut className="h-4 w-4 shrink-0 text-red-500" />
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
