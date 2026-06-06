"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { PageLoader } from "@/components/states/page-loader";
import { useWorkspace } from "@/hooks/use-workspace";
import { Sidebar } from "./sidebar";
import { TopNavbar } from "./top-navbar";

export function AppShell({ activePath, children }: { activePath: string; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, workspaces } = useWorkspace();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace(`/login?next=${encodeURIComponent(pathname || activePath)}`);
      } else if (workspaces.length === 0 && !pathname?.startsWith("/onboarding")) {
        router.replace("/onboarding");
      }
    }
  }, [activePath, isAuthenticated, isLoading, pathname, router, workspaces.length]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <PageLoader label="Redirecting to login..." />;
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="grid min-h-screen w-full grid-cols-1 xl:grid-cols-[auto_minmax(0,1fr)]">
        <Sidebar activePath={activePath} />
        <div className="flex min-w-0 flex-col">
          <TopNavbar activePath={activePath} />
          <div className="flex-1 p-5 lg:p-8">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}

