"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ModuleError } from "@/components/states/module-error";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <AppShell activePath="/products">
      <ModuleError title="Edit product failed" message="The product edit workspace could not finish rendering." retry={reset} />
    </AppShell>
  );
}
