"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ModuleError } from "@/components/states/module-error";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <AppShell activePath="/purchases">
      <ModuleError title="Create purchase order failed" message="The purchase order setup workspace could not finish rendering." retry={reset} />
    </AppShell>
  );
}
