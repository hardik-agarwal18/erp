"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Settings, ShieldCheck, UserCircle2 } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/hooks/use-workspace";

export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { session, workspace, signOut } = useWorkspace();

  return (
    <div className="relative">
      <button
        className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <Avatar>
          <AvatarFallback>{session.initials}</AvatarFallback>
        </Avatar>
        <div className="hidden sm:block">
          <p className="text-sm font-semibold text-slate-950">{session.name}</p>
          <p className="text-xs text-slate-500">{session.email}</p>
        </div>
      </button>

      {open ? (
        <div className="absolute right-0 z-40 mt-3 w-[280px] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <Avatar className="h-11 w-11">
              <AvatarFallback>{session.initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-slate-950">{session.name}</p>
              <p className="text-xs text-slate-500">{session.email}</p>
              <Badge className="mt-2" variant="info">
                {workspace.role.replace("_", " ")}
              </Badge>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {[
              { label: "My Profile", icon: UserCircle2 },
              { label: "Security", icon: ShieldCheck },
              { label: "Preferences", icon: Settings },
              { label: "Sign out", icon: LogOut },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                  onClick={async () => {
                    if (item.label === "Sign out") {
                      await signOut();
                      router.replace("/login");
                      return;
                    }

                    setOpen(false);
                  }}
                  type="button"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
