"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ModuleError } from "@/components/states/module-error";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <AppShell activePath="/products">
      <ModuleError title="Product details failed" message="The selected product could not be rendered." retry={reset} />
    </AppShell>
  );
}
