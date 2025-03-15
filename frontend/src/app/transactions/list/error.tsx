"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ModuleError } from "@/components/states/module-error";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <AppShell activePath="/transactions">
      <ModuleError title="Transaction list failed" message="The transaction list could not finish rendering." retry={reset} />
    </AppShell>
  );
}
