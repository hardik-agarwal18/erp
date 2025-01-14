"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ModuleError } from "@/components/states/module-error";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <AppShell activePath="/invoices">
      <ModuleError title="Invoice details failed" message="The selected invoice could not be rendered." retry={reset} />
    </AppShell>
  );
}
