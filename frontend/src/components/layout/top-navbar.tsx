"use client";

import { PlusSquare } from "lucide-react";

import { Breadcrumb } from "./breadcrumb";
import { CommandPalette } from "./command-palette";
import { NotificationCenter } from "./notification-center";
import { ProfileMenu } from "./profile-menu";
import { SearchBar } from "./search-bar";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/store/ui-store";

export function TopNavbar({ activePath }: { activePath: string }) {
  const { setCommandOpen } = useUiStore();

  return (
    <>
      <header className="border-b border-slate-200 bg-white/92 px-5 py-3 backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <WorkspaceSwitcher />
              <SearchBar />
            </div>
            <Breadcrumb activePath={activePath} />
          </div>

          <div className="flex items-center gap-3">
            <Button size="sm" onClick={() => setCommandOpen(true)}>
              <PlusSquare className="mr-2 h-4 w-4" />
              Quick Create
            </Button>
            <NotificationCenter />
            <ProfileMenu />
          </div>
        </div>
      </header>
      <CommandPalette />
    </>
  );
}
