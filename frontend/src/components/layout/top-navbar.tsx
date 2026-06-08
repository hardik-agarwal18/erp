"use client";

import { Menu, PlusSquare } from "lucide-react";

import { Breadcrumb } from "./breadcrumb";
import { CommandPalette } from "./command-palette";
import { NotificationCenter } from "./notification-center";
import { ProfileMenu } from "./profile-menu";
import { SearchBar } from "./search-bar";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/store/ui-store";

export function TopNavbar({ activePath }: { activePath: string }) {
  const { setCommandOpen, setSidebarOpen } = useUiStore();

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white/92 px-5 backdrop-blur dark:bg-slate-950/92 dark:border-slate-800 lg:px-8">
        <div className="flex flex-1 items-center min-w-0 gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="xl:hidden -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Breadcrumb activePath={activePath} />
        </div>

        <div className="flex flex-1 items-center justify-center max-w-xl mx-auto hidden md:flex">
          <SearchBar />
        </div>

        <div className="flex flex-1 items-center justify-end gap-3 shrink-0">
          <div className="hidden lg:block">
            <WorkspaceSwitcher />
          </div>
          <Button size="sm" variant="outline" className="hidden sm:flex dark:border-slate-800 dark:hover:bg-slate-800" onClick={() => setCommandOpen(true)}>
            <PlusSquare className="mr-2 h-4 w-4 text-slate-500" />
            Create
          </Button>
          <NotificationCenter />
          <ProfileMenu />
        </div>
      </header>
      <CommandPalette />
    </>
  );
}
