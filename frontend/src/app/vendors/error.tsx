"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ModuleError } from "@/components/states/module-error";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <AppShell activePath="/vendors">
      <ModuleError title="Vendors crashed" message="The vendor management workspace could not finish rendering." retry={reset} />
    </AppShell>
  );
}
