"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ModuleError } from "@/components/states/module-error";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <AppShell activePath="/invoices">
      <ModuleError title="Invoices crashed" message="The receivables workspace could not finish rendering." retry={reset} />
    </AppShell>
  );
}
