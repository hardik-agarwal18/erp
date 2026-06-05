"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ModuleError } from "@/components/states/module-error";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <AppShell activePath="/inventory">
      <ModuleError title="Warehouse management crashed" message="The warehouse management workspace failed to render correctly." retry={reset} />
    </AppShell>
  );
}
