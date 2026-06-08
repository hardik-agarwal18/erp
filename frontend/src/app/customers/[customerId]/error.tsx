"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ModuleError } from "@/components/states/module-error";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <AppShell activePath="/customers">
      <ModuleError title="Customer details crashed" message="The selected customer profile could not finish rendering." retry={reset} />
    </AppShell>
  );
}
