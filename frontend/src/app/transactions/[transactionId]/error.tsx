"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ModuleError } from "@/components/states/module-error";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <AppShell activePath="/transactions">
      <ModuleError title="Transaction details failed" message="The selected transaction could not be rendered." retry={reset} />
    </AppShell>
  );
}
