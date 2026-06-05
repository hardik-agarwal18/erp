import { AppShell } from "@/components/layout/app-shell";
import { ModuleLoading } from "@/components/states/module-loading";

export default function Loading() {
  return (
    <AppShell activePath="/purchases">
      <ModuleLoading title="Create Purchase Order" />
    </AppShell>
  );
}
