"use client";

import { Menu, PlusSquare, Search } from "lucide-react";

import { Breadcrumb } from "./breadcrumb";
import { CommandPalette } from "./command-palette";
import { NotificationCenter } from "./notification-center";
import { ProfileMenu } from "./profile-menu";
import { SearchBar } from "./search-bar";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/store/ui-store";

export function TopNavbar({ activePath }: { activePath: string }) {
  const { setCommandOpen, setSidebarOpen } = useUiStore();

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white/92 px-4 backdrop-blur dark:bg-slate-950/92 dark:border-slate-800 md:px-6 lg:px-8">
        <div className="flex items-center min-w-0 gap-2 md:gap-4 flex-1">
          <Button
            variant="ghost"
            size="icon"
            className="xl:hidden -ml-2 shrink-0 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="truncate min-w-0 pr-2">
            <Breadcrumb activePath={activePath} />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center max-w-xl mx-auto hidden lg:flex">
          <SearchBar />
        </div>

        <div className="flex items-center justify-end gap-2 md:gap-3 shrink-0 flex-1 lg:flex-none">
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            onClick={() => setCommandOpen(true)}
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Button>
          <div className="hidden md:block max-w-[200px]">
            <WorkspaceSwitcher />
          </div>

          <ThemeToggle />
          <NotificationCenter />
          <ProfileMenu />
        </div>
      </header>
      <CommandPalette />
    </>
  );
}
