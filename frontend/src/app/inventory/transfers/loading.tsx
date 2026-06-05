import { AppShell } from "@/components/layout/app-shell";
import { ModuleLoading } from "@/components/states/module-loading";

export default function Loading() {
  return (
    <AppShell activePath="/inventory">
      <ModuleLoading title="Stock Transfers" />
    </AppShell>
  );
}
