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
  const { isAuthenticated, isLoading } = useWorkspace();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname || activePath)}`);
    }
  }, [activePath, isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <PageLoader label="Redirecting to login..." />;
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(15,23,42,0.05),transparent_22%),linear-gradient(to_bottom,rgba(255,255,255,0.88),rgba(248,250,252,0.98))]">
      <div className="mx-auto flex min-h-screen max-w-[1440px] border-x border-slate-200 bg-white/70 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
        <Sidebar activePath={activePath} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopNavbar activePath={activePath} />
          <div className="flex-1 px-5 py-5">{children}</div>
        </div>
      </div>
    </main>
  );
}
