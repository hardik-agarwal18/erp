"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ModuleError } from "@/components/states/module-error";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <AppShell activePath="/dashboard">
      <ModuleError title="Dashboard crashed" message="Something interrupted the executive view rendering." retry={reset} />
    </AppShell>
  );
}
