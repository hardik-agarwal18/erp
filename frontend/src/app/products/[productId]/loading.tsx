import { AppShell } from "@/components/layout/app-shell";
import { ModuleLoading } from "@/components/states/module-loading";

export default function Loading() {
  return (
    <AppShell activePath="/products">
      <ModuleLoading title="Product Details" />
    </AppShell>
  );
}
