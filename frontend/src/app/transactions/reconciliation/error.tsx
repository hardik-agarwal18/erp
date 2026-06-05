"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ModuleError } from "@/components/states/module-error";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <AppShell activePath="/transactions">
      <ModuleError title="Bank reconciliation failed" message="The bank reconciliation workspace could not finish rendering." retry={reset} />
    </AppShell>
  );
}
