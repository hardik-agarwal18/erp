"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ModuleError } from "@/components/states/module-error";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <AppShell activePath="/purchases">
      <ModuleError title="Purchase details failed" message="The selected purchase order could not be rendered." retry={reset} />
    </AppShell>
  );
}
